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
  rowData: any[] = [];
  rowGeomertyData: {};
  layerBaseUrl: string = "";
  layerToken: string = "";
  layerRecords: number = 0;
  layerFields: any[] = [];
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

    // get the layer record count
    // provide drop-down for layer fields
    // pull first 50 records and display on grid
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
    this.layerFields.forEach((item) => {
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
      "&outSR=102100" +
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

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
