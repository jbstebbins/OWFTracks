import { Component, OnInit, OnDestroy, ElementRef, ChangeDetectorRef, Input, ViewChild, NgZone } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap, retry, retryWhen, delay, take } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import { GridOptions } from "ag-grid-community";
import { AllCommunityModules, Module } from "@ag-grid-community/all-modules";

import { AgGridAngular } from 'ag-grid-angular';

import { LyrToKmlWorker } from '../web-workers/lyr-to-kml.worker';

import * as _ from 'lodash';
import { jsUtils } from '../../../library/jsUtils';
import { OwfApi } from '../../../library/owf-api';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';
import { ActionNotificationService } from '../../../services/action-notification.service';
import { PreferencesService } from '../../../services/preferences.service';
import { MapMessagesService } from '../../../services/map-messages.service';

declare var $: any;

interface Track {
  title: string;
  uuid: string;
}

@Component({
  selector: 'app-features-core',
  templateUrl: './features-core.component.html',
  styleUrls: ['./features-core.component.css']
})
export class FeaturesCoreComponent implements OnInit, OnDestroy {
  config: ConfigModel = null;
  subscription: Subscription;
  mapFeaturePlotUrl: Subscription = null;
  mapStatusView: Subscription = null;

  jsutils = new jsUtils();
  owfApi = new OwfApi();
  worker: LyrToKmlWorker;

  credentialsRequired: boolean = false;
  connectionFailure: boolean = false;

  mapView: any;
  extent: any = "-3.108922936594193,-147.85116261717408," +
    "61.631880192109456,-62.06991261719688";

  divDragDropCss = {
    'display': 'none',
    'position': 'absolute',
    'z-index': 9,
    'background-color': '#f1f1f1',
    'border': '1px solid #d3d3d3',
    'text-align': 'center',
    'width': '20%',
    'font-weight': 'bolder',
    'font-size': '14px'
  }

  divRefreshCss = {
    'background-color': 'gray',
    'border': '1px solid #d3d3d3',
    'float': 'right'
  }

  divClearCss = {
    'background-color': 'gray',
    'border': '1px solid #d3d3d3',
    'float': 'right'
  }

  divLayerRefreshCss = {
    'z-index': 3,
    'width': '22px',
    'height': '22px',
    'display': 'inline'
  }

  layerRefreshImageSrc = "/OWFTracks/assets/images/refresh.svg";
  layerSearchImageSrc = "/OWFTracks/assets/images/close.svg";
  gridRefreshImageSrc = "/OWFTracks/assets/images/layer-show.png";
  gridClearImageSrc = "/OWFTracks/assets/images/clear_all.svg";
  searchText = "";

  layersPublished: boolean = false;
  layerFields: any[] = [];
  layerFieldSelected: Track;
  layerFieldsId: string;
  layerFieldsTitle: string;

  layers: any[] = [{ title: "-- SELECT LAYER --", uuid: null }];
  layersDefinition: any[] = [];
  layerSelected: Track;

  layerRecords: number = 0;
  layerPartial: number = 0;

  public layer: any = {};
  public loadComponent: boolean = false;
  public loadStatus: string = "(no layer selected!)";
  public searchValue: string;
  @ViewChild('lyrStatus') lyrStatus: ElementRef;
  @ViewChild('gridRemove') gridRemove: ElementRef;
  shutdown: boolean = false;

  gridApi;
  gridColumnApi;
  getRowNodeId;
  gridOptions: GridOptions;
  columnDefinitionsMonitor: any = [];
  paginationPageSize: 25;
  agmodules: Module[] = AllCommunityModules;
  loadGrid: boolean = false;

  domLayout = "normal";
  rowSelection = "multiple";

  rowDataMonitor: any[] = [];

  confirmDialogVisible: boolean = false;
  confirmDialogSelected: boolean = false;
  confirmDialogHeader = "Watchlist Update";
  confirmDialogContent = "Remove all items from watchlist?"

  constructor(private _zone: NgZone,
    private configService: ConfigService,
    private mapMessageService: MapMessagesService,
    private notificationService: ActionNotificationService,
    private preferencesService: PreferencesService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        //console.log(`${payload.action}, received by features-core.component`);

        if (payload.action === "LYR TOTAL COUNT") {
          this.layerRecords = payload.value.count;
          this.layerPartial = 0;

          this.layersDefinition.forEach((value, item) => {
            if (value.uuid === this.layerSelected.uuid) {
              value.tempArea.credentialsRequired = payload.value.credentialsRequired;
              value.tempArea.token = payload.value.token.replace("&token=", "").replace("token=", "");
              value.tempArea.baseUrl = payload.value.baseUrl;
            }
          });
        } else if (payload.action === "LYR PARTIAL DATA") {
          this.layerPartial = payload.value;
        } else if (payload.action === "LYR ALL DATA") {
          this.layerPartial = this.layerRecords;
        } else if (payload.action === "LYR FIELD LIST") {
          this.layerFields = [];

          this.layerFieldsId = payload.value.id;
          this.layerFieldsTitle = payload.value.title;

          let fields = payload.value.fields.split(",");
          let newFields = [];
          fields.forEach((value, index) => {
            if (value !== "") {
              let newItem = { title: value, uuid: value };
              newFields.push(newItem);
            }
          });

          this.layerFieldSelected = newFields[0];
          this.layerFields = newFields;
        } else if (payload.action === 'LYR SELECTED ADD TO WATCH LIST') {
          let status = { duplicateRow: false, maxItemsInLayer: false };
          let count = 0;

          let records = payload.value;
          records.forEach((record) => {
            if (!status.maxItemsInLayer) {
              status = this.addRecordToWatchList(record);

              if (!status.maxItemsInLayer) {
                count++;
              }
            }
          });

          if (count > 0) {
            this.divRefreshCss["background-color"] = "red";
            this.saveWatchlist();
          }
        }

        this.loadStatus = "(total records-" + this.layerRecords + "/ partial view-" + this.layerPartial + ")";
      });

    this.gridOptions = <GridOptions>{
      rowData: this.rowDataMonitor,
      columnDefs: this.createColumnDefs(),
      context: {
        componentParent: this
      },
      pagination: true
    };
  }

  ngOnInit() {
    //console.log("features-core initialized.");
    this.config = this.configService.getConfig();

    this.layerRefreshImageSrc = this.configService.getBaseHref() + "/assets/images/refresh.svg";
    this.layerSearchImageSrc = this.configService.getBaseHref() + "/assets/images/close.svg";
    this.gridRefreshImageSrc = this.configService.getBaseHref() + "/assets/images/layer-show.png";
    this.gridClearImageSrc = this.configService.getBaseHref() + "/assets/images/clear_all.svg";

    this.mapStatusView = this.mapMessageService.getMapStatusView().subscribe(
      mapView => {
        this.mapView = mapView;

        // do intial get on tracks on view change
        if (this.mapView.mapId === 1) {
          this.extent = mapView.bounds.southWest.lat + "," + mapView.bounds.northEast.lat + "," +
            mapView.bounds.southWest.lon + "," + mapView.bounds.northEast.lon;

          this.notificationService.publisherAction({
            action: 'LYR MAP REFRESHED',
            value: { field: 'mapExtent', value: this.mapView }
          });

          // refresh the map layers
          if (this.config.mapInterface.onViewChange === true) {
            this.publishLayers();
          }
        }
      });

    // create inline worker
    this.worker = new LyrToKmlWorker(() => {
      // START OF WORKER THREAD CODE

      const kmlHeader = "<kml xmlns=\"http://www.opengis.net/kml/2.2\"> " +
        "<Document> " +
        "    <name>StyleMap.kml</name> " +
        "    <open>1</open> ";
      const kmlFooter = "</Document></kml>";

      const plotMessage = {
        "overlayId": "",
        "featureId": "",
        "feature": undefined,
        "name": "",
        "zoom": true,
        "params": {
          "opacity": 1.0,
          "showLabels": true
        },
        "mapId": 1
      };

      const formatKml = (data) => {
        let kmlStyles =
          "      <Style id=\"lyrpoint\"><IconStyle><scale>.8</scale><color>" + data.color + "</color></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
          "      <Style id=\"lyrpolyline\"><LineStyle><color>" + data.color + "</color><width>2</width></LineStyle></Style> " +
          "      <Style id=\"lyrpolygon\"><LineStyle><color>" + data.color + "</color><width>2</width></LineStyle><PolyStyle><color>#a00000</color><outline>0</outline><fill>1</fill></PolyStyle></Style> ";

        plotMessage.overlayId = data.overlayId;
        plotMessage.featureId = (data.filename + "_" + data.track[data.trackNameField]).replace(/ /gi, "_");
        plotMessage.name = plotMessage.featureId;

        // format and return to main thread
        let kmlPayload = "";
        kmlPayload += "<Placemark> " +
          "<name>" + data.track[data.trackNameField] + "</name> ";

        // format geometry correctly based on type Point=(x,y); Polylines=(paths:[[[],[],[],[]],...]), Polygons=(rings:[[[],[],[],[]],[[],[],[],[]],...])
        // https://developers.arcgis.com/documentation/core-concepts/features-and-geometries/
        if (data.geometry.hasOwnProperty("x") && data.geometry.hasOwnProperty("y")) {
          kmlPayload += "<styleUrl>#lyrpoint</styleUrl> <Point><coordinates>" + data.geometry.x + "," + data.geometry.y + ",0" + "</coordinates></Point> ";
        } else if (data.geometry.hasOwnProperty("paths")) {
          kmlPayload += "<styleUrl>#lyrpolyline</styleUrl> ";
          data.geometry.paths.forEach((pathsArray) => {
            kmlPayload += "<LineString><tessellate>1</tessellate><coordinates>";
            pathsArray.forEach((pathArray) => {
              kmlPayload += pathArray[0] + "," + pathArray[1] + ",0 ";
            });
            kmlPayload += "</coordinates></LineString> ";
          });
        } else if (data.geometry.hasOwnProperty("rings")) {
          plotMessage.params.opacity = 0.35;
          kmlPayload += "<styleUrl>#lyrpolygon</styleUrl> ";

          let ringsArray = data.geometry.rings;
          let ringArray = [];
          let ringsArrayLength = ringsArray.length;
          kmlPayload += "<Polygon>";
          for (let i = 0; i < ringsArrayLength; i++) {
            if (i === 0) {
              kmlPayload += "<outerBoundaryIs><LinearRing><coordinates>";
              ringArray = ringsArray[i];
              ringArray.forEach((point) => {
                kmlPayload += point[0] + "," + point[1] + ",0 ";
              });
              kmlPayload += "</coordinates></LinearRing></outerBoundaryIs>";
            } else {
              kmlPayload += "<innerBoundaryIs><LinearRing><coordinates>";
              ringArray = ringsArray[i];
              ringArray.forEach((point) => {
                kmlPayload += point[0] + "," + point[1] + ",0 ";
              });
              kmlPayload += "</coordinates></LinearRing></innerBoundaryIs>";
            }
          }
          kmlPayload += "</Polygon> ";
        }

        kmlPayload += "<ExtendedData>";
        Object.keys(data.track).forEach((key, index) => {
          let value = data.track[key];
          if (((typeof value === "string") && (value !== undefined) && (value !== null)) &&
            (value.includes(":") || value.includes("/") || value.includes("&") || value.includes("=") || value.includes("?"))) {
            value = encodeURIComponent(value);
          }
          kmlPayload += "<Data name=\"" + key + "\"><value>" + value + "</value></Data>";
        });
        kmlPayload += "</ExtendedData></Placemark>";

        plotMessage.feature = kmlHeader + kmlStyles + kmlPayload + kmlFooter;

        // this is from DedicatedWorkerGlobalScope ( because of that we have postMessage and onmessage methods )
        // and it can't see methods of this class
        // @ts-ignore
        postMessage({
          status: "kml formatting complete", kml: plotMessage
        });

        plotMessage.feature = "";
      };

      // @ts-ignore
      onmessage = (evt) => {
        formatKml(evt.data);
      };
      // END OF WORKER THREAD CODE
    });

    this.worker.onmessage().subscribe((event) => {
      this.owfApi.sendChannelRequest("map.feature.plot", event.data.kml);
    });

    this.worker.onerror().subscribe((data) => {
      console.log(data);
    });

    // recall memory if present and activate
    if (this.configService.getMemoryValue("layers") !== undefined) {
      this.layers = this.configService.getMemoryValue("layers");
      this.layersDefinition = this.configService.getMemoryValue("layersDefinition");
      this.layerSelected = this.configService.getMemoryValue("layerSelected");

      if (this.layerSelected !== undefined) {
        this.selectedLayer({ originalEvent: null, value: this.layerSelected });
      }
    }

    // load directory if provided
    this.getDirectoryLayers();
    this.layerSelected = this.layers[0];

    // subscribe to catalog/map integration
    if (this.config.mapInterface.onPlot === true) {
      this.mapFeaturePlotUrl = this.mapMessageService.getMapFeaturePlotUrl().subscribe(
        message => {
          // only arcgis-feature are accepted
          if (message.format === "arcgis-feature") {
            let layerDefinition = message;
            layerDefinition["uuid"] = this.jsutils.uuidv4();
            layerDefinition.tempArea = {};

            // add the new item
            let newItem = { title: (layerDefinition.name + "/" + layerDefinition.overlayId), uuid: layerDefinition.uuid };

            // skip self-adding of layers
            if ((layerDefinition.overlayId !== "LYR-WatchList") &&
              (layerDefinition.overlayId !== "TMP-WatchList") &&
              (layerDefinition.overlayId !== "TMP-Viewer") &&
              (layerDefinition.overlayId !== "TMP-Locator")) {
              // check for duplication
              let duplicate = false;
              this.layersDefinition.forEach((layer) => {
                if (layer.url === layerDefinition.url) {
                  duplicate = true;
                  console.log("duplicate layer - " + layer.title + "/layer ignored.");
                }
              });

              // if duplicate, remove old item
              if (!duplicate) {
                // check if newitem name exists in layer; then change the title
                this.layers.forEach((layer) => {
                  if (layer.title === newItem.title) {
                    newItem.title = (layerDefinition.name + "/" + layerDefinition.overlayId + "_2");
                  }
                });

                // trigger angular binding
                this.layers = [...this.layers, newItem];
                this.layersDefinition = [...this.layersDefinition, layerDefinition];

                // save to memory for recall
                this.configService.setMemoryValue("layers", this.layers);
                this.configService.setMemoryValue("layersDefinition", this.layersDefinition);

                // if first time
                this._zone.run(() => {
                  if (this.layers.length === 1) {
                    this.selectedLayer({ originalEvent: null, value: newItem });
                  } else {
                    if (this.layerSelected.title !== "-- SELECT LAYER --") {
                      this.loadComponent = true;
                    }
                  }
                });
              }
            }
          } else {
            console.log("invalid format provided; only arcgis-feature supported");
          }
        });
    }
  }

  ngOnDestroy() {
    //console.log("features-core destroyed.");
    this.shutdown = true;

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();

    // prevent memory leak when component destroyed
    if (this.mapFeaturePlotUrl) {
      this.mapFeaturePlotUrl.unsubscribe();
    }

    if (this.mapStatusView) {
      this.mapStatusView.unsubscribe();
    }

    if (this.worker) {
      this.worker.terminate();
    }
  }

  private getDirectoryLayers() {
    let selectedLayer;
    this.connectionFailure = true;
    this.config.directories.forEach((directory) => {
      let directoryObserable: Observable<any> = this.http
        .get<any>(directory.path, { responseType: 'json', withCredentials: true })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError)/*, tap(console.log)*/);

      let directorySubscription = directoryObserable.subscribe(
        (directoryCollection) => {
          this.connectionFailure = false;
          directorySubscription.unsubscribe();

          directoryCollection.directory.forEach((services) => {
            // retrieve the directory and get layer list
            let layerType = "feature";
            let layerParams = this.config.layerParam.defaults;
            let layerUrl = "";
            let layerMSG, newItem;
            let urlParser, layerHost = "";
            services.layer.services.forEach((service) => {
              service["uuid"] = this.jsutils.uuidv4();
              service.tempArea = {};

              layerType = service.params.serviceType || services.layer.params.serviceType || "feature";
              if (layerType === "feature") {
                layerType = "arcgis-feature";

                // process the layer into definition

                // copy layer params from top level
                if (services.layer.params) {
                  Object.keys(services.layer.params).forEach((param) => {
                    layerParams[param] = services.layer.params[param];
                  });
                }

                // copy layer service params
                if (service.params) {
                  Object.keys(service.params).forEach((param) => {
                    layerParams[param] = service.params[param];
                  });
                }

                // cleanup params
                delete layerParams.serviceType;
                delete layerParams.url;
                delete layerParams.data;
                delete layerParams.zoom;
                delete layerParams.refresh;
                delete layerParams._comment;
                delete layerParams.intranet;

                // copy the default overrides
                if (directory.layerParam.overrides) {
                  Object.keys(directory.layerParam.overrides).forEach((param) => {
                    layerParams[param] = directory.layerParam.overrides[param];
                  });
                }

                // update service url
                layerUrl = service.url || services.properties.url;
                if ((service.params.layers !== undefined) && (service.params.layers !== null)) {
                  layerUrl = layerUrl +
                    ((layerUrl.endsWith("/")) ? "" : "/") + service.params.layers;
                }
                if ((services.properties.token !== undefined) && (services.properties.token !== null)) {
                  urlParser = new URL(layerUrl);
                  layerHost = urlParser.host;

                  // get the token if available; else parse it
                  this.config.tokenServices.forEach((service) => {
                    if ((service.serviceUrl !== undefined) && (service.serviceUrl !== null) &&
                      (service.serviceUrl === layerHost)) {
                      if (layerUrl.includes("?")) {
                        layerUrl += "&token=" + service.token;
                      } else {
                        layerUrl += "?token=" + service.token;
                      }
                    }
                  });
                }

                // create the service message for layerDefinition
                layerMSG = {};
                layerMSG.overlayId = directory.name;
                layerMSG.featureId = service.name;
                layerMSG.name = service.name;
                layerMSG.format = layerType;
                layerMSG.params = layerParams;
                if ((service.params.zoom !== undefined) || (service.params.zoom !== null)) {
                  layerMSG.zoom = service.params.zoom;
                }

                layerMSG.mapId = 1;
                layerMSG.url = layerUrl;
                layerMSG["uuid"] = service["uuid"];
                layerMSG.tempArea = {};

                // check roles to for command set option in infotemplate

                // add the new item
                newItem = { title: (layerMSG.name + "/" + layerMSG.overlayId), uuid: service.uuid };
                if (!selectedLayer) {
                  selectedLayer = newItem;
                }

                // trigger angular binding
                this.layers = [...this.layers, newItem];
                this.layersDefinition = [...this.layersDefinition, layerMSG];
              }
            });
          });

          // save the list to memory store
          this.configService.setMemoryValue("layers", this.layers);
          this.configService.setMemoryValue("layersDefinition", this.layersDefinition);

          // activate the first layer
          // this.layerSelected = selectedLayer;
          // this.selectedLayer({ originalEvent: null, value: this.layerSelected });
        },
        error => {
          console.log('HTTP Error', error);
        },
        () => {
          if (!this.connectionFailure) {
            //console.log('HTTP request completed.');
          } else {
            window.alert('OPS Track Widget: HTTP other layer error; not trapped.\n' +
              directory);
          }
        });
    });
  }

  private createColumnDefs() {
    this.columnDefinitionsMonitor = [
      { field: 'id', hide: true },
      { headerName: 'Watch List', field: 'title', sortable: true, dndSource: true, resizable: true },
      { headerName: 'Layer', field: 'name', sortable: true, resizable: true },
      { field: 'esriOIDFieldname', resizable: true },
      { field: 'esriOIDValue', resizable: true },
      { field: 'esriTitleFieldname', resizable: true },
      { field: 'service', hide: true }
    ];

    return this.columnDefinitionsMonitor;
  }

  onGridReady(params) {
    //console.log("features-core ready.");
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    this.updateGridData();
  }

  private updateGridData() {
    // load the last state of the active.state
    let restoreSettingsObservable: Observable<any> = this.preferencesService.getPreference("track.search.filter",
      "active.state.version");
    let restoreSettings = restoreSettingsObservable.subscribe(model => {
      restoreSettings.unsubscribe();

      if ((model.value === undefined) || (model.value === null) || (model.value === "")) {
      } else {
        restoreSettingsObservable = this.preferencesService.getPreference("track.search.filter",
          "active.state");
        restoreSettings = restoreSettingsObservable.subscribe(model => {
          restoreSettings.unsubscribe();

          if (model.value !== undefined) {
            let records = JSON.parse(model.value);
            // check all records to make sure they are not in the serviceurl/token list
            let urlArray = [], urlParamArray = [], urlParams = "", index = 0, watchItem = [];
            this.config.tokenServices.forEach((token) => {
              records.forEach((record) => {
                // fix the record watch list name to remove extra items
                watchItem = record.title.split(/\(.*\)\//);
                record.title = watchItem[0];

                // fix the token on save watch items
                if (record.service.url.includes(token.serviceUrl)) {
                  urlArray = record.service.url.split("?");
                  urlParamArray = urlArray[1].split("&");

                  if ((record.service.tempArea === undefined) || (record.service.tempArea === null)) {
                    record.service.tempArea = {};
                    record.service.tempArea.baseUrl = urlArray[0];
                    record.service.tempArea.credentialsRequired = false;
                  }

                  record.service.tempArea.token = token.token.replace("&token=", "").replace("token=", "");
                  index = 0;
                  urlParams = "";
                  urlParamArray.forEach((param) => {
                    if (param.startsWith("token=")) {
                    } else {
                      if (index === 0) {
                        urlParams = param;
                      } else {
                        urlParams += "&" + param;
                      }
                    }

                    index++;
                  });

                  record.service.url = urlArray[0] + ((urlParams !== "") ? ("?" + urlParams) : "");
                  if (record.service.tempArea.token !== "") {
                    record.service.url += ((urlParams !== "") ? ("&token=" + record.service.tempArea.token) : "?token=" + record.service.tempArea.token);
                  }
                }
              });
            });

            this.rowDataMonitor = [...records];

            if (records.length > 0) {
              this.loadStatus = "(no layer selected!/ active list ready!)";
            }
          }
        });
      }
    });
  }

  onFirstDataRendered(params) {
  }

  paginationNumberFormatter(params) {
    return "[" + params.value.toLocaleString() + "]";
  }

  onRowClicked() {
    var selectedRows = this.gridApi.getSelectedRows();

    if (selectedRows.length > 0) {
      this.publishLayersLocationFinder(selectedRows[0]);
    }
  }

  searchListener($event: any): void {
    if ($event.key === "Enter") {
      this.searchValue = ($event.target.value + "").trim();

      this.notificationService.publisherAction({
        action: 'LYR SEARCH VALUE',
        value: { field: this.layerFieldSelected.title, value: this.searchValue }
      });
    }
  }

  selectedLayer($event: any): void {
    this.layerSelected = $event.value;
    this.configService.setMemoryValue("layerSelected", this.layerSelected);

    // change ui state and force change
    this.loadComponent = false;
    this.cdr.detectChanges();

    if (this.layerSelected.title !== "-- SELECT LAYER --") {
      this.layersDefinition.forEach((value, index) => {
        if (value.uuid === this.layerSelected.uuid) {
          this.layer = value;
          this.loadComponent = true;
        }
      });
    }
  }

  gridDragOver(event) {
    var dragSupported = event.dataTransfer.types.length;

    if (dragSupported) {
      event.dataTransfer.dropEffect = "copy";
      event.preventDefault();

      this.divDragDropCss.display = 'block';
      window.setTimeout(() => {
        this.divDragDropCss.display = 'none';
      }, 5000);
    }
  }

  gridDragDrop(event) {
    event.preventDefault();
    this.divDragDropCss.display = 'none';

    var userAgent = window.navigator.userAgent;
    var isIE = userAgent.indexOf('Trident/') >= 0;
    var jsonData = event.dataTransfer.getData(isIE ? 'text' : 'application/json');
    var data = JSON.parse(jsonData);

    if (!data || (data[this.layerFieldsId] === undefined) || (data[this.layerFieldsTitle] === undefined)) {
      return;
    }

    let status = this.addRecordToWatchList(data);

    if (!status.duplicateRow) {
      this.divRefreshCss["background-color"] = "red";
      this.saveWatchlist();
    } else {
      console.log("duplicate row, skipping.");
    }
  }

  addRecordToWatchList(record): any {
    let newItem = {
      id: this.jsutils.uuidv4(),
      title: record[this.layerFieldsTitle],
      name: this.layerSelected.title,
      esriOIDFieldname: this.layerFieldsId,
      esriOIDValue: record[this.layerFieldsId],
      esriTitleFieldname: this.layerFieldsTitle,
      service: { url: "" }
    };

    this.layersDefinition.forEach((layer) => {
      if (layer.uuid === this.layerSelected.uuid) {
        newItem.service = layer;
      }
    });

    // do nothing if row is already in the grid, otherwise we would have duplicates
    let duplicateRow = false;
    let layerCount = 0;
    this.rowDataMonitor.forEach((row) => {
      if (row.service.url === newItem.service.url) {
        if (row.title === newItem.title) {
          duplicateRow = true;
        }
        layerCount++;
      }
    });

    if (!duplicateRow && (layerCount < 20)) {
      // store and allow user to view
      let records = [...this.rowDataMonitor, newItem];
      this.rowDataMonitor = records;
    }

    if (layerCount >= 20) {
      window.alert('OPS Track Widget: 20 items per layer for watch list exceeded!');
    }

    return {duplicateRow: duplicateRow, maxItemsInLayer: ((layerCount >= 20) ? true : false)};
  }

  divDragOver(event) {
    var dragSupported = event.dataTransfer.types.length;

    if (dragSupported) {
      event.dataTransfer.dropEffect = "copy";
      event.preventDefault();
    }
  }

  divDragDrop(event) {
    event.preventDefault();
    this.divDragDropCss.display = 'none';

    var userAgent = window.navigator.userAgent;
    var isIE = userAgent.indexOf('Trident/') >= 0;
    var jsonData = event.dataTransfer.getData(isIE ? 'text' : 'application/json');
    var data = JSON.parse(jsonData);

    if (!data || (data.service === undefined)) {
      return;
    }

    // find the record to remove
    let deleteId = -1;
    this.rowDataMonitor.forEach((row, index) => {
      if (row.id === data.id) {
        deleteId = index;
      }
    });

    // delete the record
    if (deleteId !== -1) {
      this.rowDataMonitor.splice(deleteId, 1);

      let records = [...this.rowDataMonitor];
      this.rowDataMonitor = records;
    }

    this.divRefreshCss["background-color"] = "red";
    this.saveWatchlist();
  }

  clearWatchlist(event?) {
    let selectedItems = this.gridApi.getSelectedRows();

    if (selectedItems.length > 0) {
      this.confirmDialogSelected = true;
      this.confirmDialogContent = "Remove all or selected items from watchlist?";
    } else {
      this.confirmDialogSelected = false;
      this.confirmDialogContent = "Remove all items from watchlist?";
    }
    this.confirmDialogVisible = true;
  }

  handleConfirmAll(event) {
    this.confirmDialogVisible = false;

    this.rowDataMonitor = [];
    this.divRefreshCss["background-color"] = "gray";

    this.saveWatchlist();
  }

  handleConfirmSelected(event) {
    let selectedItems = this.gridApi.getSelectedRows();
    let rowIds = [];
    let records = [];

    this.confirmDialogVisible = false;

    // collect all the rows
    if (selectedItems.length > 0) {
      selectedItems.forEach((row) => {
        rowIds.push(row.id);
      });

      // find the record to remove
      this.rowDataMonitor.forEach((row, index) => {
        if (rowIds.indexOf(row.id) !== -1) {
        } else {
          records.push(row);
        }
      });

      this.rowDataMonitor = records;
      this.divRefreshCss["background-color"] = "red";
    }
  }

  publishLayers(event?) {
    if ((event !== undefined) && (event !== null)) {
      this.layersPublished = true;
    }

    if (this.layersPublished) {
      // group the layers by service.overlayId+service.featureId, (esriOIDValue...), esriOIDFieldname
      let services = {};
      let service, layerId;

      // remove existing overlay 
      if ((this.divRefreshCss["background-color"] === "gray") ||
        (this.divRefreshCss["background-color"] === "red") ||
        (this.divRefreshCss["background-color"] === "green")) {
        this.divRefreshCss["background-color"] = "orange";
        this.owfApi.sendChannelRequest('map.overlay.remove', 'LYR-WatchList');

        this.rowDataMonitor.forEach((row, index) => {
          layerId = "LYR-WatchList-" + row.service.featureId.replace(/[^a-zA-Z0-9]/g, "");
          if (services[layerId] === undefined) {
            service = {
              service: row.service,
              esriOIDFieldname: row.esriOIDFieldname,
              idList: [row.esriOIDValue]
            }

            services[layerId] = service;
          } else {
            services[layerId].idList.push(row.esriOIDValue);
          }
        });

        let plotMessageQueue = [];
        let plotMessage: any = {};
        let value;
        Object.keys(services).forEach((layer) => {
          value = services[layer];

          plotMessage = {
            "overlayId": "LYR-WatchList",
            "featureId": layer,
            "name": value.service.name,
            "format": "arcgis-feature",
            "params": value.service.params,
            "mapId": 1,
            "url": value.service.url
          }

          plotMessage.params["definitionExpression"] = value.esriOIDFieldname + " IN (" + value.idList.join() + ")";
          plotMessageQueue.push({ channel: "map.feature.plot.url", message: JSON.parse(JSON.stringify(plotMessage)) });
        });

        // process the queue on timer
        let queueInterval = setInterval(() => {
          if (plotMessageQueue.length === 0) {
            clearInterval(queueInterval);
            this.divRefreshCss["background-color"] = "green";
          } else {
            let queueItem = plotMessageQueue.splice(0, 1);
            if (queueItem.length > 0) {
              this.owfApi.sendChannelRequest(queueItem[0].channel, queueItem[0].message);
            }
          }
        }, 1500);
      }
    }
  }

  saveWatchlist() {
    // save the current state of the active list
    let saveSettingsObservable: Observable<any> = this.preferencesService.setPreference("track.search.filter",
      "active.state.version", this.config.stateVersion);
    let saveSettings = saveSettingsObservable.subscribe(model => {
      saveSettings.unsubscribe();
    });
    saveSettingsObservable = this.preferencesService.setPreference("track.search.filter",
      "active.state", this.rowDataMonitor);
    saveSettings = saveSettingsObservable.subscribe(model => {
      saveSettings.unsubscribe();
    });
  }

  publishLayersLocationFinder(layer) {
    // group the layers by service.overlayId+service.featureId, (esriOIDValue...), esriOIDFieldname
    let credentialsRequired = layer.service.tempArea.credentialsRequired;
    let baseUrl = layer.service.tempArea.baseUrl;
    let token = layer.service.tempArea.token;

    // retrieve the record count
    let url = baseUrl + "/query?" + "f=json" +
      "&returnGeometry=true" +
      "&returnQueryGeometry=true" +
      "&returnExceededLimitFeatures=true" +
      "&outFields=*" +
      //"&orderByFields=" + this.layerIDField +
      //"&resultOffset=" + this.layerOffset +
      //"&resultRecordCount=" + this.layerMaxRecords +
      "&outSR=4326" +
      "&spatialRel=esriSpatialRelIntersects";

    // add field filters if required
    url += "&where=" + layer.esriOIDFieldname + "%20IN%20(" + layer.esriOIDValue + ")";

    if ((token !== undefined) && (token !== null) && (token !== "")) {
      url += "&token=" + token;
    }
    let urlRecorddata: Observable<any>;

    if (!credentialsRequired) {
      urlRecorddata = this.http
        .get<any>(url, { responseType: 'json' })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError)/*, tap(console.log)*/);
    } else {
      urlRecorddata = this.http
        .get<any>(url, { responseType: 'json', withCredentials: true })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError)/*, tap(console.log)*/);
    }

    let urlRecordSubscription = urlRecorddata.subscribe(model => {
      urlRecordSubscription.unsubscribe();

      // send notification to parent that partial result was returned
      if (model.features) {
        let recordCount = model.features.length;
        let record = {};
        let geometry = {};

        model.features.forEach((row) => {
          Object.keys(row.attributes).forEach((column, index) => {
            record[column] = row.attributes[column];
          });

          geometry = row.geometry;
        });

        this.worker.postMessage({
          overlayId: "TMP-Locator", filename: "TMP-Locator",
          trackNameField: layer.esriTitleFieldname,
          track: record,
          color: "#2700FF", geometry: geometry
        });

        window.setTimeout(() => {
          this.owfApi.sendChannelRequest("map.feature.unplot", {
            overlayId: "TMP-Locator",
            featureId: ("TMP-Locator" + "_" + record[layer.esriTitleFieldname]).replace(/ /gi, "_")
          });
        }, 10000);
      } else {
        alert("error retrieving data: code-" + model.error.code + "/" + model.error.message);
      }
    });
  }

  refreshLayer($event) {
    this.selectedLayer({ originalEvent: null, value: this.layerSelected });
  }

  searchRefresh($event) {
    this.searchText = "";
    this.searchListener({ "key": "Enter", "target": { "value": "" } });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(errorMessage);
  }

}
