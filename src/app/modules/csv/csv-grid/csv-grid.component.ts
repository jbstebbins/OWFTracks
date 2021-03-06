import { Component, OnInit, OnDestroy, ElementRef, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap, retry, retryWhen, delay, take } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import * as _ from 'lodash';
import { OwfApi } from '../../../library/owf-api';

import { GridOptions } from "ag-grid-community";
import { AllCommunityModules, Module } from "@ag-grid-community/all-modules";

import { AgGridAngular } from 'ag-grid-angular';

import { CsvToKmlWorker } from '../web-workers/csv-to-kml.worker';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';
import { ActionNotificationService } from '../../../services/action-notification.service';

import { jsUtils } from '../../../library/jsUtils';

@Component({
  selector: 'app-csv-grid',
  templateUrl: './csv-grid.component.html',
  styleUrls: ['./csv-grid.component.css']
})
export class CsvGridComponent implements OnInit, OnDestroy {
  config: ConfigModel = null;
  subscription: Subscription;

  jsutils = new jsUtils();
  owfApi = new OwfApi();
  worker: CsvToKmlWorker;

  credentialsRequired: boolean = false;
  connectionFailure: boolean = false;

  divQueryStatusCss = {
    'display': 'none',
    'width': '100%',
    'background-color': 'gold',
    'z-index': '99',
    'position': 'fixed',
    'color': 'black'
  }
  queryStatusMessage = "please wait, querying services...";

  @ViewChild('agGridCSV') agGrid: AgGridAngular;

  gridApi;
  gridColumnApi;
  getRowNodeId;
  gridOptions: GridOptions;
  columnDefinitions: any = [];
  paginationPageSize: 25;
  agmodules: Module[] = AllCommunityModules;

  searchValue: string = "";
  rowHeaders: any[] = [];
  rowData: any[] = [];
  rowDataUpdate: any[] = [];
  columnTracking: any[] = [-1, -1, -1, -1, -1, -1];       // title/name, lat, lon, course, bearing, speed
  filterActive: boolean = false;
  mmsiList: string[] = [];
  mmsiListBatch: any[] = [];
  mmsiListBatchIndex: 0;
  selectedNodesCache: any[] = [];

  domLayout = "normal";
  rowSelection = "multiple";

  @Input()
  parentFileName: string;

  @Input()
  parentData: any[];

  @Input()
  parentMessage: any[];

  @Input()
  parentColor: any[];

  layer: any = {};
  layerBaseUrl: string = "";
  layerServiceUrl: string = "";
  layerToken: string = "";
  layerRecords: number = 0;
  layerFields: any[] = [];
  layerTitleField: string = "";
  layerOffset: number = 0;
  layerMaxRecords: number = 1000;
  layerIDField: string = "";
  layerAdvancedFeatures: any;
  layerMMSIFieldName = "";
  layerCOURSEFieldName = "";
  layerBEARINGFieldName = "";
  layerSPEEDFieldName = "";

  getRowStyle = function (params) {
    if (params.node.selected) {
      if ((params.data["*UPD*"] !== undefined) && (params.data["*UPD*"] === "Y")) {
        return { 'background-color': '#3CD94F' };
      } else {
        return { 'background-color': '#D88F36' };
      }
    } else if ((params.data["*UPD*"] !== undefined) && (params.data["*UPD*"] === "Y")) {
      return { 'background-color': '#258731' };
    } else {
      return { 'background-color': 'white' };
    }
  }

  constructor(private configService: ConfigService,
    private http: HttpClient,
    private notificationService: ActionNotificationService) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        //console.log(`${payload.action}, received by csv-grid.component`);

        if (payload.action === "CSV LAYERSYNC LAYERINFO") {
          this.layer = payload.value;
          this.getLayerInfo();
        } else
          if (payload.action === "CSV SEARCH VALUE") {
            this.searchValue = payload.value;
            //this.gridApi.onFilterChanged();

            this.gridApi.deselectAll();
            this.gridApi.deselectAllFiltered();

            this.gridApi.redrawRows({ rowNodes: this.selectedNodesCache });
            this.selectedNodesCache = this.gridApi.getSelectedNodes();
        
            if (this.searchValue !== "") {
              this.filterActive = true;
            } else {
              this.filterActive = false;
            }

            this.gridApi.setQuickFilter(this.searchValue);
          } else if ((payload.action === "CSV PLOT ON MAP") || (payload.action === "CSV SAVE TO CATALOG")) {
            let tracks = [];
            if (this.filterActive) {
              let selectedRows = this.gridApi.getSelectedRows();
              if (selectedRows.length !== 0) {
                tracks = selectedRows;
              } else {
                this.gridApi.forEachNodeAfterFilter((node, index) => {
                  tracks.push(node.data);
                });
              }
            } else {
              let selectedRows = this.gridApi.getSelectedRows();
              if (selectedRows.length !== 0) {
                tracks = selectedRows;
              } else {
                tracks = this.rowData;
              }
            }

            let workerData = {
              overlayId: "CSV-Viewer",
              filename: this.parentFileName, tracks: tracks,
              showLabels: payload.value.showLabels, color: payload.value.color,
              columnTracking: this.columnTracking, mmsiEnabled: (this.layerMMSIFieldName !== ""),
              baseUrl: this.configService.getBaseHref(),
              saveToCatalog: false, showZoom: payload.value.showZoom
            };

            if (payload.action === "CSV SAVE TO CATALOG") {
              workerData.saveToCatalog = true;
            }

            this.worker.postMessage(workerData);
          }
      });
  }

  ngOnInit() {
    //console.log("csv-grid created.");
    this.config = this.configService.getConfig();

    this.gridOptions = <GridOptions>{
      rowData: this.rowData,
      columnDefs: this.createColumnDefs(),
      context: {
        componentParent: this
      },
      pagination: true
    };

    // create inline worker
    this.worker = new CsvToKmlWorker(() => {
      // START OF WORKER THREAD CODE

      const kmlHeader = "<kml xmlns=\"http://www.opengis.net/kml/2.2\"> " +
        "<Document> " +
        "    <name>StyleMap.kml</name> " +
        "    <open>1</open> ";
      const kmlFooter = "</Document></kml>";

      const plotMessage = {
        "overlayId": "CSV-Viewer",
        "featureId": "",
        "feature": undefined,
        "name": "",
        "zoom": true,
        "params": {
          "zoom": true,
          "showLabels": "true",
          "opacity": 0.55
        },
        "mapId": 1
      };

      const formatKml = (data) => {
        let kmlStyles = "";
        kmlStyles = "      <Style id=\"csv_style\"><IconStyle><scale>.8</scale><color>" + data.color + "</color></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
          "<Style id=\"csv_notfound\"><IconStyle><scale>.8</scale><color>" + data.color + "</color></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
          "<Style id=\"csv_found\"><IconStyle><color>" + data.color + "</color><scale>1.0</scale><Icon><href>" + data.baseUrl + "/assets/images/aisSquare.png</href></Icon></IconStyle></Style> ";

        plotMessage.overlayId = data.overlayId;
        plotMessage.featureId = data.filename;
        plotMessage.name = data.filename;
        plotMessage.params.showLabels = data.showLabels;
        plotMessage.zoom = data.showZoom;
        plotMessage.params.zoom = data.showZoom;

        // format and return to main thread
        let kmlPayload = "";
        let coords, lonX, latY;
        data.tracks.forEach(track => {
          // check if geom is provided
          if (data.columnTracking[2] === data.columnTracking[1]) {
            if (track[data.columnTracking[1]].includes(";")) {
              coords = track[data.columnTracking[1]].replace("POINT(", "").replace(")", "").split(";")
              lonX = coords[0];
              latY = coords[1];
            } else {
              coords = track[data.columnTracking[1]].replace("POINT(", "").replace(")", "").split(" ");
              lonX = coords[0];
              latY = coords[1];
            }
          } else {
            lonX = track[data.columnTracking[2]];
            latY = track[data.columnTracking[1]];
          }
          kmlPayload += "<Placemark> " +
            "<name>" + track[data.columnTracking[0]] + "</name> ";

          if (!data.mmsiEnabled) {
            kmlPayload += "<styleUrl>#csv_style</styleUrl> ";
          } else {
            if ((track["*UPD*"] !== undefined) && (track["*UPD*"] === "Y")) {
              kmlPayload += "<styleUrl>#csv_found</styleUrl> ";
              if ((data.columnTracking[3] !== -1) && (track[data.columnTracking[3]] !== undefined) &&
                (track[data.columnTracking[3]] !== null) && (track[data.columnTracking[3]] !== "")) {
                kmlPayload += "<Style><IconStyle><heading>" + track[data.columnTracking[3]] + "</heading></IconStyle></Style>";
              }
            } else {
              kmlPayload += "<styleUrl>#csv_notfound</styleUrl> ";
            }
          }

          kmlPayload +=
            "<Point><coordinates>" + lonX + "," + latY + ",0" + "</coordinates></Point> ";

          kmlPayload += "<ExtendedData>";
          Object.keys(track).forEach((key, index) => {
            let value = track[key];

            if (((typeof value === "string") && (value !== undefined) && (value !== null)) &&
              (value.includes(":") || value.includes("/") || value.includes("&") || value.includes("=") || value.includes("?") ||
                value.includes("<") || value.includes(">"))) {
              value = encodeURIComponent(value);
            }

            kmlPayload += "<Data name=\"" + key + "\"><value>" + value + "</value></Data>";
          });
          kmlPayload += "</ExtendedData></Placemark>";
        });

        plotMessage.feature = kmlHeader + kmlStyles + kmlPayload + kmlFooter;

        // this is from DedicatedWorkerGlobalScope ( because of that we have postMessage and onmessage methods )
        // and it can't see methods of this class
        // @ts-ignore
        postMessage({
          status: "kml formatting complete", kml: plotMessage, saveToCatalog: data.saveToCatalog
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

      if (event.data.saveToCatalog) {
        this.owfApi.sendChannelRequest("catalog.favorite.add", event.data.kml);
      }

      this.setQueryStatus("", "reset");
    });

    this.worker.onerror().subscribe((data) => {
      console.log(data);
    });
  }

  ngOnDestroy() {
    //console.log("csv-grid destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();

    if (this.worker) {
      this.worker.terminate();
    }
  }

  sendNotification(payload) {
    this.notificationService.publisherAction(payload);
    //console.log(`${payload.action}, pressed from csv-grid.component`);
  }

  private createColumnDefs() {
    this.columnDefinitions = [];
    this.rowHeaders = [];

    if (this.parentData.length > 0) {
      let index = 0;
      let header = this.parentData[0];

      let titleIndex = -1, latIndex = -1, lonIndex = -1, courseIndex = -1, bearingIndex = -1, speedIndex = -1;
      let itemTemp = "", geom;
      let mmsiFound = false, updFound = false;
      header.forEach((item) => {
        if (index < 50) {
          item = item.replace(/[^0-9a-z -_]/gi, '').substring(0, 20);
          itemTemp = item.toLowerCase();

          this.rowHeaders.push(item);
          this.columnDefinitions.push({
            field: item,
            sortable: true,
            filter: true,
            resizable: true
          });

          // set column tracking for parsing
          if ((itemTemp === "title") || (itemTemp === "name")) {
            titleIndex = item;
          } else if (itemTemp === "course") {
            courseIndex = item;
          } else if (itemTemp === "bearing") {
            bearingIndex = item;
          } else if (itemTemp === "speed") {
            speedIndex = item;
          } else if (itemTemp === "*upd*") {
            updFound = true;
          } else if (((itemTemp.includes("title")) || (itemTemp.includes("name"))) &&
            (titleIndex === -1)) {
            titleIndex = item;
          } else if (((itemTemp === "latitude") || (itemTemp === "lat") ||
            (itemTemp === "coordy") || (itemTemp === "pointy") || (itemTemp === "y")) &&
            (latIndex === -1)) {
            latIndex = item;
          } else if (((itemTemp === "longitude") || (itemTemp === "lon") ||
            (itemTemp === "coordx") || (itemTemp === "pointx") || (itemTemp === "x")) &&
            (lonIndex === -1)) {
            lonIndex = item;
          } else if (itemTemp === "geom") {
            latIndex = item;
            lonIndex = item;
          } else if ((itemTemp === "point") || (itemTemp === "x/y") || (itemTemp === "x;y")) {
            latIndex = item;
            lonIndex = item;
          } else if (itemTemp === "mmsi") {
            mmsiFound = true;
          }
        }

        index++;
      });

      // tracking for data parsing
      if (mmsiFound && !updFound) {
        this.rowHeaders.push("*UPD*");
        this.columnDefinitions.push({
          field: "*UPD*",
          sortable: true,
          filter: true,
          resizable: true
        });
      }
      if (mmsiFound) {
        this.notificationService.publisherAction({ action: 'CSV LAYERSYNC ENABLED', value: true })
      }
      this.columnTracking = [titleIndex, latIndex, lonIndex, courseIndex, bearingIndex, speedIndex];

      // remove header row from imported data
      this.parentData.splice(0, 1);
    }

    return this.columnDefinitions;
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    this.updateGridData();

    // autosize all columns
    let allColumnIds = [];
    this.gridColumnApi.getAllColumns().forEach(function (column) {
      allColumnIds.push(column.colId);
    });
    this.gridColumnApi.autoSizeColumns(allColumnIds, false);

    if ((this.columnTracking[0] === -1) ||
      (this.columnTracking[1] === -1) || (this.columnTracking[2] === -1)) {
      alert('CSV/XLS import data invalid; (no name/title, lat/latitude, or lon/logitude columns found!)');
      this.notificationService.publisherAction({ action: 'CSV INVALID DATA', value: true });
    } else {
      this.notificationService.publisherAction({ action: 'CSV INVALID DATA', value: false });
    }
  }

  onFirstDataRendered(params) {
  }

  private getLayerInfo() {
    this.setQueryStatus("layer info query...");

    // clear current update indicator
    this.rowData.forEach((row) => {
      row["*UPD*"] = "";
    });
    this.gridApi.redrawRows();

    // split the url and extract the token (if provided)
    let urlArray = [] = this.layer.url.split("?");
    this.layerBaseUrl = urlArray[0];

    // get referer
    let urlParser = new URL(this.layerBaseUrl);
    this.layerServiceUrl = urlParser.host;

    // get the token if available; else parse it
    this.layerToken = "";
    this.config.tokenServices.forEach((service) => {
      if ((service.serviceUrl !== undefined) && (service.serviceUrl !== null) &&
        (service.serviceUrl === this.layerServiceUrl)) {
        this.layerToken = service.token;
      }
    });

    // get token from params
    if (this.layerToken === "") {
      let urlParamArray = [];
      if (urlArray.length > 1) {
        urlParamArray = urlArray[1].split("&");
        if (urlParamArray.length >= 1) {
          urlParamArray.forEach((value, index) => {
            if (value.startsWith("token=")) {
              this.layerToken = value.replace("&token=", "").replace("token=", "");
            }
          });
        }
      }
    }

    // get the layer definition
    let url = this.layerBaseUrl + "?" + "f=json";
    if ((this.layerToken !== undefined) && (this.layerToken !== null) && (this.layerToken !== "")) {
      url += "&token=" + this.layerToken;
    }
    let urlMetadata: Observable<any>;

    this.connectionFailure = true;
    if (!this.credentialsRequired) {
      urlMetadata = this.http
        .get<any>(url, { responseType: 'json' })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError)/*, tap(console.log)*/);
    } else {
      urlMetadata = this.http
        .get<any>(url, { responseType: 'json', withCredentials: true })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError)/*, tap(console.log)*/);
    }

    // handle error
    let urlMetadataSubscription = urlMetadata.subscribe(
      (response) => {
        this.connectionFailure = false;

        this.layerFields = response.fields;
        this.layerAdvancedFeatures = response.advancedQueryCapabilities;
        urlMetadataSubscription.unsubscribe();

        // check if layerFields have mmsi
        let mmsiFound = false;
        this.layerMMSIFieldName = "";
        this.layerCOURSEFieldName = "";
        this.layerBEARINGFieldName = "";
        this.layerSPEEDFieldName = "";
        this.layerFields.forEach((field) => {
          if (field.name.toLowerCase() === "mmsi") {
            mmsiFound = true;
            this.layerMMSIFieldName = field.name;
          } else if (field.name.toLowerCase() === "course") {
            this.layerCOURSEFieldName = field.name;
          } else if (field.name.toLowerCase() === "bearing") {
            this.layerBEARINGFieldName = field.name;
          } else if (field.name.toLowerCase() === "speed") {
            this.layerSPEEDFieldName = field.name;
          }
        });

        // retrieve the record count
        if (mmsiFound) {
          // https://developers.arcgis.com/rest/services-reference/query-map-service-layer-.htm
          let url = this.layerBaseUrl + "/query?" + "f=json" +
            "&where=1%3D1" +
            "&returnGeometry=false" +
            "&returnCountOnly=true";

          if ((this.layerToken !== undefined) && (this.layerToken !== null) && (this.layerToken !== "")) {
            url += "&token=" + this.layerToken;
          }
          let urlRecordCountdata: Observable<any>;

          if (!this.credentialsRequired) {
            urlRecordCountdata = this.http
              .get<any>(url, { responseType: 'json' })
              .pipe(
                retryWhen(errors => errors.pipe(delay(2000), take(2))),
                catchError(this.handleError)/*, tap(console.log)*/);
          } else {
            urlRecordCountdata = this.http
              .get<any>(url, { responseType: 'json', withCredentials: true })
              .pipe(
                retryWhen(errors => errors.pipe(delay(2000), take(2))),
                catchError(this.handleError)/*, tap(console.log)*/);
          }

          let urlRecordCountSubscription = urlRecordCountdata.subscribe(model => {
            urlRecordCountSubscription.unsubscribe();

            this.layerRecords = model.count;

            this.setQueryStatus("layer data query...");
            // split data in 20 records at a time
            this.mmsiListBatch = [];

            let listLength = this.mmsiList.length;
            let listBatchSize = Math.ceil(listLength / 15);
            let mmsiList = [...this.mmsiList];
            for (let i = 0; i < listBatchSize; i++) {
              this.mmsiListBatch.push(mmsiList.splice(0, 15));
            }

            this.mmsiListBatchIndex = 0;
            this.rowDataUpdate = [];
            this.retrieveLayerData();
          });
        } else {
          this.setQueryStatus("layer error/mmsi field not found");
          window.alert('OPS Track Widget: layer does not contain mmsi field for track match.\n' +
            this.layerBaseUrl);
        }
      },
      error => {
        console.log('HTTP Error', error);
        this.setQueryStatus("layer error/" + error, "error");
      },
      () => {
        if (!this.connectionFailure) {
          //console.log('HTTP request completed.');
          this.setQueryStatus("", "reset");
        } else if (!this.credentialsRequired) {
          this.credentialsRequired = true;
          this.getLayerInfo();
        } else {
          this.setQueryStatus("layer error (external)...", "error");
          window.alert('OPS Track Widget: HTTP other layer error; not trapped.\n' +
            this.layerBaseUrl);
        }
      });
  }

  private retrieveLayerData() {
    this.setQueryStatus("data query... (" + this.mmsiListBatchIndex + " of " + this.mmsiListBatch.length + ")");

    if (this.mmsiListBatchIndex < this.mmsiListBatch.length) {
      // https://developers.arcgis.com/rest/services-reference/query-map-service-layer-.htm
      let url = this.layerBaseUrl + "/query?" + "f=json" +
        "&returnGeometry=true" +
        "&returnQueryGeometry=true" +
        "&returnExceededLimitFeatures=true" +
        "&outFields=*" +
        //"&orderByFields=" + this.layerIDField +
        //"&resultOffset=" + this.layerOffset +
        //"&resultRecordCount=" + this.layerMaxRecords +
        "&outSR=4326";

      // add field filters if required
      let batch = this.mmsiListBatch[this.mmsiListBatchIndex];
      this.mmsiListBatchIndex++;

      url += "&where=" + this.layerMMSIFieldName + "+IN+" +
        encodeURIComponent("(" + batch.join(",") + ")");

      if ((this.layerToken !== undefined) && (this.layerToken !== null) && (this.layerToken !== "")) {
        url += "&token=" + this.layerToken;
      }
      let urlRecorddata: Observable<any>;

      this.connectionFailure = true;
      if (!this.credentialsRequired) {
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

      let urlRecordSubscription = urlRecorddata.subscribe((model) => {
        urlRecordSubscription.unsubscribe();

        this.connectionFailure = false;
        this.setQueryStatus("data received, processing...");

        // send notification to parent that partial result was returned
        if (model.features) {
          let recordCount = model.features.length;

          window.setTimeout(() => {
            this.retrieveLayerData();
          }, 50);

          // update the grid data
          let index = 0;
          model.features.forEach((feature) => {
            index = this.mmsiList.indexOf("'" + feature.attributes[this.layerMMSIFieldName] + "'");

            if (index !== -1) {
              this.rowData[index][this.columnTracking[1]] = feature.geometry.y;
              this.rowData[index][this.columnTracking[2]] = feature.geometry.x;
              this.rowData[index]["*UPD*"] = "Y";

              // update course, bearing, speed if needed and exist
              if ((this.columnTracking[3] !== -1) && (this.layerCOURSEFieldName !== "")) {
                this.rowData[index][this.columnTracking[3]] = feature.attributes[this.layerCOURSEFieldName];
              }
              if ((this.columnTracking[4] !== -1) && (this.layerBEARINGFieldName !== "")) {
                this.rowData[index][this.columnTracking[4]] = feature.attributes[this.layerBEARINGFieldName];
              }
              if ((this.columnTracking[5] !== -1) && (this.layerSPEEDFieldName !== "")) {
                this.rowData[index][this.columnTracking[5]] = feature.attributes[this.layerSPEEDFieldName];
              }

              this.rowDataUpdate.push(this.rowData[index]);
            }
          });
        } else {
          this.setQueryStatus("data received, error... /code-" + model.error.code + "/" + model.error.message, "error");
          alert("error retrieving data: code-" + model.error.code + "/" + model.error.message);
        }
      },
        error => {
          console.log('HTTP Error', error);
          this.setQueryStatus("data query, error/" + error, "error");
        },
        () => {
          if (!this.connectionFailure) {
            //console.log('HTTP request completed.');
            this.setQueryStatus("", "reset");
          } else if (!this.credentialsRequired) {
            this.credentialsRequired = true;
            this.getLayerInfo();
          } else {
            this.setQueryStatus("data query error (external)...", "error");
            window.alert('OPS Tracks Widget: HTTP other layer error; not trapped.\n' +
              this.layerBaseUrl);
          }
        });
    } else {
      this.agGrid.api.updateRowData({ update: this.rowDataUpdate });
      this.rowDataUpdate = [];
      this.setQueryStatus("", "reset");
    }
  }

  private updateGridData(filterText?: string) {
    this.rowData = [];
    this.mmsiList = [];

    if ((filterText !== null) && (filterText !== undefined)) {
      filterText = filterText.toLowerCase();
    }

    let records = [];
    let record = {};
    let index = 0, validRecord = false;
    let columnValue = "";
    let coordinates = "";
    let count = 0;
    this.parentData.forEach((value) => {
      if (value) {
        record = {};
        index = 0;

        if ((filterText !== null) && (filterText !== undefined)) {
          if (columnValue.toLowerCase().includes(filterText)) {
            validRecord = true;
          }
        } else {
          validRecord = true;
        }

        this.rowHeaders.forEach((header) => {
          record[header] = value[index++];

          if (header.toLowerCase() === "mmsi") {
            this.mmsiList.push("'" + record[header] + "'");
          } else
            // convert lat/lon if needed
            if ((this.columnTracking[1] !== this.columnTracking[2]) &&
              ((header === this.columnTracking[1]) || (header === this.columnTracking[2]))) {
              coordinates = record[header] + "";
              count = this.jsutils.countChars(coordinates, " ");

              // dms to dd conversion when 2, DMM when 1
              if (count === 2) {
                record[header] = this.jsutils.convertDMSDD(coordinates);
              } else if (count === 1) {
                record[header] = this.jsutils.convertDDMDD(coordinates);
              }

            }
        });

        if (validRecord) {
          records.push(record);
        }
      }
    });

    this.rowData = records;
    //this.agGrid.api.setRowData(this.rowData);
  }

  paginationNumberFormatter(params) {
    return "[" + params.value.toLocaleString() + "]";
  }

  onRowClicked($event) {
    this.selectedNodesCache.push($event.node);
    this.gridApi.redrawRows({ rowNodes: this.selectedNodesCache });
    this.selectedNodesCache = this.gridApi.getSelectedNodes();

    if ((this.columnTracking[0] === -1) ||
      (this.columnTracking[1] === -1) || (this.columnTracking[2] === -1)) {
    } else {
      var selectedRows = this.gridApi.getSelectedRows();

      let tracks;
      if (selectedRows.length > 0) {
        tracks = selectedRows;
        this.notificationService.publisherAction({ action: 'CSV SELECTED COUNT', value: selectedRows.length });

        let track = tracks[0];
        this.worker.postMessage({
          overlayId: "TMP-Viewer",
          filename: (this.parentFileName + "_" + track[this.columnTracking[0]]).replace(/ /gi, "_"),
          tracks: tracks,
          color: "#000000", columnTracking: this.columnTracking, mmsiEnabled: (this.layerMMSIFieldName !== ""),
          baseUrl: this.configService.getBaseHref(),
          saveToCatalog: false, showZoom: true
        });

        window.setTimeout(() => {
          this.owfApi.sendChannelRequest("map.feature.unplot", {
            overlayId: "TMP-Viewer",
            featureId: (this.parentFileName + "_" + track[this.columnTracking[0]]).replace(/ /gi, "_")
          });
        }, 10000);
      }
    }
  }

  setQueryStatus(message, status?) {
    let resetMessage = "please wait, ";
    if ((status !== undefined) && (status !== null)) {
      if (status === "error") {
        this.queryStatusMessage = resetMessage + " /" + message;
        this.divQueryStatusCss.display = "table-cell";
        this.divQueryStatusCss["background-color"] = "red";
        this.divQueryStatusCss.color = "white";
      } else if (status === "reset") {
        this.divQueryStatusCss.display = "none";
        this.divQueryStatusCss["background-color"] = "gold";
        this.divQueryStatusCss.color = "black";
      }
    } else {
      this.queryStatusMessage = resetMessage + " /" + message;
      this.divQueryStatusCss.display = "table-cell";
      this.divQueryStatusCss["background-color"] = "gold";
      this.divQueryStatusCss.color = "black";
    }
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
