import { Component, OnInit, OnDestroy, ElementRef, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap } from 'rxjs/operators';

import { HttpClient, HttpHeaders } from '@angular/common/http';

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
          console.log(payload.value);
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
      if (urlParamArray.length > 1) {
        urlParamArray.forEach((value, index) => {
          if (value.startWith("token=")) {
            this.layerToken = "&" + value;
          }
        });
      }
    }

    // get the layer definition
    let url = this.layerBaseUrl + "?" + "f=json" + this.layerToken;
    let urlMetadata: Observable<any> = this.http
      .get<any>(url, { responseType: 'json' })
      .pipe(
        catchError(this.handleError('retrieveConfig', [])),
        tap(console.log));

    let urlMetadataSubscription = urlMetadata.subscribe(model => {
      this.layerFields = model.fields;
      this.layerAdvancedFeatures = model.advancedQueryCapabilities;
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
      let urlRecordCountdata: Observable<any> = this.http
        .get<any>(url, { responseType: 'json' })
        .pipe(
          catchError(this.handleError('retrieveConfig', [])),
          tap(console.log));

      let urlRecordCountSubscription = urlRecordCountdata.subscribe(model => {
        urlRecordCountSubscription.unsubscribe();

        this.layerRecords = model.count;
        this.notificationService.publisherAction({ action: 'LYR TOTAL COUNT', value: model.count });

        this.retrieveLayerData();
      });
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
        "overlayId": "LYR-Viewer",
        "featureId": "",
        "feature": undefined,
        "name": "",
        "zoom": true
      };

      const formatKml = (data) => {
        let kmlStyles =
          "      <Style id=\"csv_style\"><IconStyle><scale>.8</scale><color>" + data.color + "</color></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> ";

        plotMessage.featureId = (data.filename + "_" + data.track[data.trackNameField]).replace(/ /gi, "_");
        plotMessage.name = plotMessage.featureId;

        // format and return to main thread
        let kmlPayload = "";
        kmlPayload += "<Placemark> " +
          "<name>" + data.track[data.trackNameField] + "</name> " +
          "<styleUrl>#csv_style</styleUrl> " +
          "<Point><coordinates>" + data.geometry.x + "," + data.geometry.y + ",0" + "</coordinates></Point> ";

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

  private createColumnDefs() {
    this.columnDefinitions = [];

    let fieldList = "";
    let itemNameTemp = "";
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

        this.columnDefinitions.push({
          field: item.name,
          sortable: true,
          filter: true
        });
      }
    });

    if (this.layerTitleField === "") {
      this.layerTitleField = this.layerIDField;
    }

    this.loadGrid = true;

    this.notificationService.publisherAction({ action: 'LYR FIELD LIST', value: fieldList });
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
    console.log(url);

    let urlRecorddata: Observable<any> = this.http
      .get<any>(url, { responseType: 'json' })
      .pipe(
        catchError(this.handleError('retrieveConfig', [])),
        tap(console.log));

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
    console.log(selectedRows);

    if (selectedRows.length > 0) {
      this.plotTemporaryMarker(selectedRows[0]);
    }
  }

  plotTemporaryMarker(selectedRow) {
    let oid = selectedRow[this.layerIDField];
    let geometry = this.rowGeomertyData[oid];

    this.worker.postMessage({
      filename: this.parentLayer.name, trackNameField: this.layerTitleField,
      track: selectedRow,
      color: "#ff0000", geometry: geometry
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
