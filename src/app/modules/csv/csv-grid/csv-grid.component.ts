import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators'

import * as _ from 'lodash';
import { OwfApi } from '../../../library/owf-api';

import { GridOptions } from "ag-grid-community";
import { AgGridAngular } from 'ag-grid-angular';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';

import { ActionNotificationService } from '../../../services/action-notification.service';

@Component({
  selector: 'app-csv-grid',
  templateUrl: './csv-grid.component.html',
  styleUrls: ['./csv-grid.component.css']
})
export class CsvGridComponent implements OnInit {

  subscription: Subscription;
  owfApi = new OwfApi();

  config: ConfigModel = null;

  @ViewChild('agGridCSV') agGrid: AgGridAngular;

  gridApi;
  gridColumnApi;
  getRowNodeId;
  gridOptions: GridOptions;
  columnDefinitions: any = [];
  paginationPageSize: 25;

  rowHeaders: any[] = [];
  rowData: any[] = [];

  domLayout = "normal";

  @Input()
  gridData: any[];

  constructor(private configService: ConfigService,
    private notificationService: ActionNotificationService) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}, received by csv-grid.component`);
      }
    );
  }

  ngOnInit() {
    console.log("csv-grid created.");
    this.config = this.configService.getConfig();

    console.log(this.gridData);
    this.gridOptions = <GridOptions>{
      rowData: this.rowData,
      columnDefs: this.createColumnDefs(),
      context: {
        componentParent: this
      },
      pagination: true
    };
  }

  ngOnDestroy() {
    console.log("csv-grid destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

  sendNotification(payload) {
    this.notificationService.subscriberAction(payload);
    console.log(`${payload.action}, pressed from csv-grid.component`);
  }

  private createColumnDefs() {
    this.columnDefinitions = [];
    this.rowHeaders = [];

    if (this.gridData.length > 0) {
      let index = 0;
      let header = this.gridData[0];

      header.forEach((item) => {
        if (index < 50) {
          this.rowHeaders.push(item);
          this.columnDefinitions.push({
            field: item,
            sortable: true,
            filterable: true
          });
        }

        index++;
      });
    }

    return this.columnDefinitions;
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    this.updateGridData();
  }

  onFirstDataRendered(params) {
  }

  private updateGridData() {
    this.rowData = [];

    let records = [];
    let record = {};
    let index = 0;
    this.gridData.forEach((value) => {
      if (value) {
        record = {};
        index = 0;
        this.rowHeaders.forEach((header) => {
          if ((value[index] !== null) && (value[index] !== undefined)) {
            record[header] = value[index++];
          }
        });

        records.push(record);
      }
    });

    this.rowData = records;
    //this.agGrid.api.setRowData(this.rowData);
  }

  paginationNumberFormatter(params) {
    return "[" + params.value.toLocaleString() + "]";
  }
}
