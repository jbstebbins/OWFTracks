import { Component, OnInit, OnDestroy, ElementRef, ChangeDetectorRef, Input, ViewChild } from '@angular/core';
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

import { ActionNotificationService } from '../../../services/action-notification.service';
import { PreferencesService } from '../../../services/preferences.service';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';
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
    'z-index': 3,
    'background-color': '#f1f1f1',
    'border': '1px solid #d3d3d3',
    'float': 'right',
    'position': 'absolute',
    'right': '80%'
  }

  divLayerRefreshCss = {
    'z-index': 3,
    'width': '22px',
    'height': '22px',
    'display': 'inline'
  }

  searchText = "";

  subscription: Subscription;
  mapFeaturePlotUrl: Subscription = null;

  jsutils = new jsUtils();
  owfApi = new OwfApi();
  worker: LyrToKmlWorker;

  layerFields: any[] = [];
  layerFieldSelected: Track;
  layerFieldsId: string;
  layerFieldsTitle: string;

  layers: any[] = [];
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
  rowSelection = "single";

  rowDataMonitor: any[] = [];

  constructor(private configService: ConfigService,
    private mapMessageService: MapMessagesService,
    private notificationService: ActionNotificationService,
    private preferencesService: PreferencesService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}, received by features-core.component`);

        if (payload.action === "LYR TOTAL COUNT") {
          this.layerRecords = payload.value.count;

          this.layersDefinition.forEach((value, item) => {
            if (value.uuid === this.layerSelected.uuid) {
              value.tempArea.credentialsRequired = payload.value.credentialsRequired;
              value.tempArea.token = payload.value.token;
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
    console.log("features-core initialized.");

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
          "opacity": 0.4,
          "showLabels": true
        }
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
          kmlPayload += "<styleUrl>#lyrpolygon</styleUrl> ";

          let ringsArray = data.geometry.rings;
          let ringArray = [];
          kmlPayload += "<Polygon>";
          for (let i = 0; i < ringsArray.length; i++) {
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

    // subscribe to catalog/map integration
    this.mapFeaturePlotUrl = this.mapMessageService.getMapFeaturePlotUrl().subscribe(
      message => {
        // only arcgis-feature are accepted
        if (message.format === "arcgis-feature") {
          let layerDefinition = message;
          layerDefinition["uuid"] = this.jsutils.uuidv4();
          layerDefinition.tempArea = {};

          // skip self-adding of layers
          if ((layerDefinition.overlayId !== "LYR-WatchList") &&
            (layerDefinition.overlayId !== "TMP-WatchList") &&
            (layerDefinition.overlayId !== "TMP-Viewer") &&
            (layerDefinition.overlayId !== "TMP-Locator")) {
            // check for duplication
            let duplicate = false;
            this.layers.forEach((value, index) => {
              if (value.title === (layerDefinition.name + "/" + layerDefinition.overlayId)) {
                duplicate = true;
                console.log("duplicate layer - " + value.title + "/prior layer replaced.");
              }
            });

            // if duplicate, remove old item
            if (duplicate) {
              //this.selectedLayer({ originalEvent: null, value: this.layerSelected });
              this.layersDefinition.forEach((layer) => {
                if ((layer.overlayId === layerDefinition.overlayId) && (layer.name === layerDefinition.name)) {
                  duplicate = true;

                  if (layer.url !== layerDefinition.url) {
                    layer.url = layerDefinition.url;
                    layer.params = layerDefinition.params;

                    this.layerSelected = { title: (layerDefinition.name + "/" + layerDefinition.overlayId), uuid: layer.uuid };
                    this.selectedLayer({ originalEvent: null, value: this.layerSelected });
                  }
                }
              });
            }

            if (!duplicate) {
              // add the new item
              let newItem = { title: (layerDefinition.name + "/" + layerDefinition.overlayId), uuid: layerDefinition.uuid };

              // trigger angular binding
              this.layers = [...this.layers, newItem];
              this.layersDefinition = [...this.layersDefinition, layerDefinition];

              // save to memory for recall
              this.configService.setMemoryValue("layers", this.layers);
              this.configService.setMemoryValue("layersDefinition", this.layersDefinition);

              // if first time
              if (this.layers.length === 1) {
                this.selectedLayer({ originalEvent: null, value: newItem });
              } else {
                this.loadComponent = true;
              }
            }
          }
        } else {
          console.log("invalid format provided; only arcgis-feature supported");
        }
      });
  }

  ngOnDestroy() {
    console.log("features-core destroyed.");
    this.shutdown = true;

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();

    // prevent memory leak when component destroyed
    if (this.mapFeaturePlotUrl) {
      this.mapFeaturePlotUrl.unsubscribe();
    }

    if (this.worker) {
      this.worker.terminate();
    }
  }

  private createColumnDefs() {
    this.columnDefinitionsMonitor = [
      { field: 'id', hide: true },
      { headerName: 'Watch List', field: 'title', sortable: true, dndSource: true },
      { field: 'name', hide: true },
      { field: 'service', hide: true },
      { field: 'uuid', hide: true }
    ];

    return this.columnDefinitionsMonitor;
  }

  onGridReady(params) {
    console.log("features-core ready.");
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    this.updateGridData();
  }

  private updateGridData() {
    // load the last state of the active.state
    let restoreSettingsObservable: Observable<any> = this.preferencesService.getPreference("track.search.filter",
      "active.state");
    let restoreSettings = restoreSettingsObservable.subscribe(model => {
      restoreSettings.unsubscribe();

      if (model.value !== undefined) {
        let records = JSON.parse(model.value);
        this.rowDataMonitor = [...records];

        if (records.length > 0) {
          this.loadStatus = "(no layer selected!/active list ready!)";
        }
      }
    });
  }

  onFirstDataRendered(params) {
  }

  paginationNumberFormatter(params) {
    return "[" + params.value.toLocaleString() + "]";
  }

  onSelectionChanged() {
    var selectedRows = this.gridApi.getSelectedRows();

    if (selectedRows.length > 0) {
      this.publishLayersLocationFinder(selectedRows[0]);
    }
  }

  searchListener($event: any): void {
    if ($event.key === "Enter") {
      this.searchValue = $event.target.value;
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

    this.layersDefinition.forEach((value, index) => {
      if (value.uuid === this.layerSelected.uuid) {
        this.layer = value;
        this.loadComponent = true;
      }
    });
  }

  gridDragOver(event) {
    var dragSupported = event.dataTransfer.types.length;

    if (dragSupported) {
      event.dataTransfer.dropEffect = "copy";
      event.preventDefault();

      this.divDragDropCss.display = 'block';
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

    let newItem = {
      id: this.jsutils.uuidv4(),
      title: data[this.layerFieldsTitle] + " (" + this.layerSelected.title + ")" + "/" + data[this.layerFieldsId],
      name: this.layerSelected.title,
      esriOIDFieldname: this.layerFieldsId,
      esriOIDValue: data[this.layerFieldsId],
      esriTitleFieldname: this.layerFieldsTitle,
      service: ""
    };

    this.layersDefinition.forEach((layer) => {
      if (layer.uuid == this.layerSelected.uuid) {
        newItem.service = layer;
      }
    });

    // do nothing if row is already in the grid, otherwise we would have duplicates
    let duplicateRow = false;
    this.rowDataMonitor.forEach((row) => {
      if ((row.service === newItem.service) && (row.title === newItem.title)) {
        duplicateRow = true;
      }
    });

    if (!duplicateRow) {
      let records = [...this.rowDataMonitor, newItem];
      this.rowDataMonitor = records;

      this.publishLayers();
    } else {
      console.log("duplicate row, skipping.");
    }
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

    this.publishLayers();
  }

  publishLayers() {
    // group the layers by service.overlayId+service.featureId, (esriOIDValue...), esriOIDFieldname
    let services = {};
    let service;

    this.rowDataMonitor.forEach((row, index) => {
      if (services[row.service.uuid] === undefined) {
        service = {
          service: row.service,
          esriOIDFieldname: row.esriOIDFieldname,
          idList: [row.esriOIDValue]
        }

        services[row.service.uuid] = service;
      } else {
        services[row.service.uuid].idList.push(row.esriOIDValue);
      }
    });

    let plotMessageQueue = [];
    let plotMessage = {};
    let value;
    Object.keys(services).forEach((layer) => {
      value = services[layer];

      plotMessage = {
        "overlayId": "LYR-WatchList",
        "featureId": "LYR-WatchList_" + value.service.featureId,
        "name": value.service.name,
        "format": "arcgis-feature",
        "params": {
          "serviceType": "feature",
          "format": "image/png",
          "refreshInterval": "0.10",
          "zoom": "false",
          "showLabels": "false",
          "opacity": 0.5,
          "transparent": "true",
          "useProxy": "false",
          "layers": "5",
          "mode": "ondemand",
          "definitionExpression": value.esriOIDFieldname + " IN (" + value.idList.join() + ")"
        },
        "mapId": 1,
        "url": value.service.url
      }

      plotMessageQueue.push({channel: "map.feature.plot.url", message: plotMessage});
    });

    // process the queue on timer
    let queueInterval = setInterval(() => {
      if (plotMessageQueue.length === 0) {
        clearInterval(queueInterval);
      } else {
        let queueItem = plotMessageQueue.splice(0, 1);
        if (queueItem.length > 0) {
          console.log("send request for watch list - " + queueItem[0].message);
          this.owfApi.sendChannelRequest(queueItem[0].channel, queueItem[0].message);
        }
      }
    }, 2000);

    // save the current state of the active list
    let saveSettingsObservable: Observable<any> = this.preferencesService.setPreference("track.search.filter",
      "active.state", this.rowDataMonitor);
    let saveSettings = saveSettingsObservable.subscribe(model => {
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

    url += token;
    let urlRecorddata: Observable<any>;

    if (!credentialsRequired) {
      urlRecorddata = this.http
        .get<any>(url, { responseType: 'json' })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError),
          tap(console.log));
    } else {
      urlRecorddata = this.http
        .get<any>(url, { responseType: 'json', withCredentials: true })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError),
          tap(console.log));
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
        }, 5000);
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
    this.searchListener({"key": "Enter"});
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
