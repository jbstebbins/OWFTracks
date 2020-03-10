import { Component, OnInit, OnDestroy, ElementRef, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap, retry, retryWhen, delay, take } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import * as _ from 'lodash';
import { OwfApi } from '../../../library/owf-api';

import { GridOptions } from "ag-grid-community";
import { AllCommunityModules, Module } from "@ag-grid-community/all-modules";

import { AgGridAngular } from 'ag-grid-angular';

import { LyrToKmlWorker } from '../web-workers/lyr-to-kml.worker';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';
import { ActionNotificationService } from '../../../services/action-notification.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Component({
  selector: 'app-features-grid',
  templateUrl: './features-grid.component.html',
  styleUrls: ['./features-grid.component.css']
})
export class FeaturesGridComponent implements OnInit, OnDestroy {

  subscription: Subscription;

  owfApi = new OwfApi();
  worker: LyrToKmlWorker;

  config: ConfigModel = null;
  credentialsRequired: boolean = false;
  connectionFailure: boolean = false;

  @ViewChild('agGridLYR') agGrid: AgGridAngular;

  gridApi;
  gridColumnApi;
  getRowNodeId;
  gridOptions: GridOptions;
  columnDefinitions: any = [];
  paginationPageSize: 25;
  agmodules: Module[] = AllCommunityModules;
  loadGrid: boolean = false;

  domLayout = "normal";
  rowSelection = "single";

  rowData: any[] = [];
  rowGeomertyData: {};
  layerBaseUrl: string = "";
  layerToken: string = "";
  layerRecords: number = 0;
  layerFields: any[] = [];
  layerTitleField: string = "";
  layerOffset: number = 0;
  layerMaxRecords: number = 1000;
  layerIDField: string = "";
  layerAdvancedFeatures: any;

  @Input()
  parentLayer: any = {};

  constructor(private configService: ConfigService,
    private notificationService: ActionNotificationService,
    private http: HttpClient) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}, received by features-grid.component`);
        if (payload.action === "LYR SEARCH VALUE") {
          this.retrieveLayerData(payload.value.field, payload.value.value);
        }
      });
  }

  ngOnInit() {
    console.log("features-grid initialized.");

    // split the url and extract the token (if provided)
    let urlArray = [] = this.parentLayer.url.split("?");
    this.layerBaseUrl = urlArray[0];

    let urlParamArray = [];
    this.layerToken = "";
    if (urlArray.length > 1) {
      urlParamArray = urlArray[1].split("&");
      if (urlParamArray.length >= 1) {
        urlParamArray.forEach((value, index) => {
          if (value.startsWith("token=")) {
            this.layerToken = "&" + value;
          }
        });
      }
    }

    // get layer info
    this.getLayerInfo();

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
  }

  ngOnDestroy() {
    console.log("features-grid destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();

    if (this.worker) {
      this.worker.terminate();
    }
  }

  private getLayerInfo() {
    // get the layer definition
    let url = this.layerBaseUrl + "?" + "f=json" + this.layerToken;
    let urlMetadata: Observable<any>;

    this.connectionFailure = true;
    if (!this.credentialsRequired) {
      urlMetadata = this.http
        .get<any>(url, { responseType: 'json' })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError),
          tap(console.log));
    } else {
      urlMetadata = this.http
        .get<any>(url, { responseType: 'json', withCredentials: true })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError),
          tap(console.log));
    }

    // handle error
    let urlMetadataSubscription = urlMetadata.subscribe(
      response => {
        this.connectionFailure = false;

        this.layerFields = response.fields;
        this.layerAdvancedFeatures = response.advancedQueryCapabilities;
        urlMetadataSubscription.unsubscribe();

        // build the grid layout
        this.gridOptions = <GridOptions>{
          rowData: this.rowData,
          columnDefs: this.createColumnDefs(),
          context: {
            componentParent: this
          },
          pagination: true
        };

        // retrieve the record count
        let url = this.layerBaseUrl + "/query?" + "f=json" +
          "&where=1%3D1" +
          "&returnGeometry=false" +
          "&returnCountOnly=true" +
          this.layerToken;
        let urlRecordCountdata: Observable<any>;

        if (!this.credentialsRequired) {
          urlRecordCountdata = this.http
            .get<any>(url, { responseType: 'json' })
            .pipe(
              retryWhen(errors => errors.pipe(delay(2000), take(2))),
              catchError(this.handleError),
              tap(console.log));
        } else {
          urlRecordCountdata = this.http
            .get<any>(url, { responseType: 'json', withCredentials: true })
            .pipe(
              retryWhen(errors => errors.pipe(delay(2000), take(2))),
              catchError(this.handleError),
              tap(console.log));
        }

        let urlRecordCountSubscription = urlRecordCountdata.subscribe(model => {
          urlRecordCountSubscription.unsubscribe();

          this.layerRecords = model.count;
          this.notificationService.publisherAction({
            action: 'LYR TOTAL COUNT',
            value: {
              count: model.count,
              baseUrl: this.layerBaseUrl,
              credentialsRequired: this.credentialsRequired,
              token: this.layerToken
            }
          });

          this.retrieveLayerData();
        });
      },
      error => console.log('HTTP Error', error),
      () => {
        if (!this.connectionFailure) {
          console.log('HTTP request completed.');
        } else if (!this.credentialsRequired) {
          this.credentialsRequired = true;
          this.getLayerInfo();
        } else {
          window.alert('Search Widget: HTTP other layer error; not trapped.\n' +
            this.layerBaseUrl);
        }
      });
  }

  private createColumnDefs() {
    this.columnDefinitions = [];

    let fieldList = "";
    let itemNameTemp = "";
    let newItem;
    this.layerFields.forEach((item) => {
      itemNameTemp = item.name.toLowerCase();
      if (itemNameTemp.includes("name") || itemNameTemp.includes("title")) {
        this.layerTitleField = item.name;
      }

      if (item.type === "esriFieldTypeOID") {
        this.layerIDField = item.name;
      }

      if (item.type !== "esriFieldTypeGeometry") {
        fieldList += item.name + ",";

        newItem = {
          field: item.name,
          sortable: true,
          filter: true,
          dndSource: (item.name === this.layerIDField)
        };

        if (item.name === this.layerIDField) {
          this.columnDefinitions.splice(0, 0, newItem);
        } else if (item.name === this.layerTitleField) {
          this.columnDefinitions.splice(1, 0, newItem);
        } else {
          this.columnDefinitions.push(newItem);
        }
      }
    });

    if (this.layerTitleField === "") {
      this.layerTitleField = this.layerIDField;
    }

    this.loadGrid = true;

    this.notificationService.publisherAction({
      action: 'LYR FIELD LIST',
      value: { fields: fieldList, id: this.layerIDField, title: this.layerTitleField }
    });
    return this.columnDefinitions;
  }

  sendNotification(payload) {
    this.notificationService.subscriberAction(payload);
    console.log(`${payload.action}, pressed from features-grid.component`);
  }

  onGridReady(params) {
    console.log("features-grid ready.");
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    this.updateGridData();
  }

  private updateGridData() {
    this.rowData = [];
    let records = [];

    this.rowData = records;
    //this.agGrid.api.setRowData(this.rowData);
  }

  onFirstDataRendered(params) {
  }

  paginationNumberFormatter(params) {
    return "[" + params.value.toLocaleString() + "]";
  }

  retrieveLayerData(field?, value?) {
    // retrieve the record count
    let url = this.layerBaseUrl + "/query?" + "f=json" +
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
    if ((field !== undefined) && (value !== undefined)) {
      url += "&where=" + field + "+like+%27%25" + value + "%25%27";
    } else {
      url += "&where=1%3D1";
    }

    url += this.layerToken;
    let urlRecorddata: Observable<any>;

    if (!this.credentialsRequired) {
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
        if (recordCount < this.layerRecords) {
          this.notificationService.publisherAction({ action: 'LYR PARTIAL DATA', value: recordCount });
        } else {
          this.notificationService.publisherAction({ action: 'LYR ALL DATA', value: recordCount });
        }

        this.rowData = [];
        this.rowGeomertyData = {};

        let records = [];
        let record = {};
        model.features.forEach((row) => {
          record = {};

          this.columnDefinitions.forEach((column, index) => {
            record[column.field] = row.attributes[column.field];
          });

          this.rowGeomertyData[row.attributes[this.layerIDField]] = row.geometry;
          records.push(record);
        });

        this.rowData = records;
        // this.agGrid.api.setRowData(this.rowData);
      } else {
        alert("error retrieving data: code-" + model.error.code + "/" + model.error.message);
      }
    });
  }

  onSelectionChanged() {
    var selectedRows = this.gridApi.getSelectedRows();

    if (selectedRows.length > 0) {
      this.plotTemporaryMarker(selectedRows[0]);
    }
  }

  plotTemporaryMarker(selectedRow) {
    let oid = selectedRow[this.layerIDField];
    let geometry = this.rowGeomertyData[oid];

    this.worker.postMessage({
      overlayId: "TMP-Viewer", filename: this.parentLayer.name, 
      trackNameField: this.layerTitleField,
      track: selectedRow,
      color: "#ff0000", geometry: geometry
    });

    window.setTimeout(() => {
      this.owfApi.sendChannelRequest("map.feature.unplot", {
        overlayId: "TMP-Viewer",
        featureId: (this.parentLayer.name + "_" + selectedRow[this.layerTitleField]).replace(/ /gi, "_")
      });
    }, 10000);
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
