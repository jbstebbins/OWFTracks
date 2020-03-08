import { Component, OnInit, OnDestroy, ElementRef, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators'

import * as _ from 'lodash';
import { OwfApi } from '../../../library/owf-api';

import { GridOptions } from "ag-grid-community";
import { AllCommunityModules, Module } from "@ag-grid-community/all-modules";

import { AgGridAngular } from 'ag-grid-angular';

import { CsvToKmlWorker } from '../web-workers/csv-to-kml.worker';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';
import { ActionNotificationService } from '../../../services/action-notification.service';

@Component({
  selector: 'app-csv-grid',
  templateUrl: './csv-grid.component.html',
  styleUrls: ['./csv-grid.component.css']
})
export class CsvGridComponent implements OnInit, OnDestroy {
  subscription: Subscription;

  owfApi = new OwfApi();
  worker: CsvToKmlWorker;

  config: ConfigModel = null;

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
  columnTracking: any[] = [];
  filterActive: boolean = false;

  domLayout = "normal";

  @Input()
  parentFileName: string;

  @Input()
  parentData: any[];

  @Input()
  parentMessage: any[];

  @Input()
  parentColor: any[];

  constructor(private configService: ConfigService,
    private notificationService: ActionNotificationService) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}, received by csv-grid.component`);

        if (payload.action === "CSV SEARCH VALUE") {
          this.searchValue = payload.value;
          //this.gridApi.onFilterChanged();

          if (this.searchValue !== "") {
            this.filterActive = true;
          } else {
            this.filterActive = false;
          }

          this.gridApi.setQuickFilter(this.searchValue);
        } else if (payload.action === "CSV PLOT ON MAP") {
          let tracks = [];
          if (this.filterActive) {
            this.gridApi.forEachNodeAfterFilter((node, index) => {
              tracks.push(node.data);
            });
          } else {
            tracks = this.rowData;
          }

          this.worker.postMessage({
            filename: this.parentFileName, tracks: tracks,
            color: payload.value.color, columnTracking: this.columnTracking
          });
        }
      });
  }

  ngOnInit() {
    console.log("csv-grid created.");
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
        "zoom": false
      };

      const formatKml = (data) => {
        let kmlStyles =
        "      <Style id=\"csv_style\"><IconStyle><scale>.8</scale><color>" + data.color + "</color></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> ";

        plotMessage.featureId = data.filename;
        plotMessage.name = data.filename;

        // format and return to main thread
        let kmlPayload = "";
        data.tracks.forEach(track => {
          kmlPayload += "<Placemark> " +
            "<name>" + track[data.columnTracking[0]] + "</name> " +
            "<styleUrl>#csv_style</styleUrl> " +
            "<Point><coordinates>" + track[data.columnTracking[2]] + "," + track[data.columnTracking[1]] + ",0" + "</coordinates></Point> ";

          kmlPayload += "<ExtendedData>";
          Object.keys(track).forEach((key, index) => {
            kmlPayload += "<Data name=\"" + key + "\"><value>" + track[key] + "</value></Data>";
          });
          kmlPayload += "</ExtendedData></Placemark>";
        });

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
    console.log("csv-grid destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();

    if (this.worker) {
      this.worker.terminate();
    }
  }

  sendNotification(payload) {
    this.notificationService.subscriberAction(payload);
    console.log(`${payload.action}, pressed from csv-grid.component`);
  }

  private createColumnDefs() {
    this.columnDefinitions = [];
    this.rowHeaders = [];

    if (this.parentData.length > 0) {
      let index = 0;
      let header = this.parentData[0];

      let titleIndex = "", latIndex = "", lonIndex = "";
      let itemTemp = "";
      header.forEach((item) => {
        if (index < 50) {
          item = item.replace(/[^0-9a-z -_]/gi, '').substring(0, 20);
          itemTemp = item.toLowerCase();

          this.rowHeaders.push(item);
          this.columnDefinitions.push({
            field: item,
            sortable: true,
            filter: true
          });

          // set column tracking for parsing
          if (((itemTemp === "title") || (itemTemp === "name")) &&
            (titleIndex === "")) {
            titleIndex = item;
          } else if (((itemTemp === "latitude") || (itemTemp === "lat")) &&
            (latIndex === "")) {
            latIndex = item;
          } else if (((itemTemp === "longitude") || (itemTemp === "lon")) &&
            (lonIndex === "")) {
            lonIndex = item;
          }
        }

        index++;
      });

      // tracking for data parsing
      this.columnTracking = [titleIndex, latIndex, lonIndex];

      // remove header row from imported data
      this.parentData.splice(0, 1);
    }

    return this.columnDefinitions;
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    this.updateGridData();

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

  private updateGridData(filterText?: string) {
    this.rowData = [];

    if ((filterText !== null) && (filterText !== undefined)) {
      filterText = filterText.toLowerCase();
    }

    let records = [];
    let record = {};
    let index = 0, validRecord = false;
    let columnValue = "";
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
}
