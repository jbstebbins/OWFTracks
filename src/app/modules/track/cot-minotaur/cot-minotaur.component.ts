import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators'

import { GridOptions } from "ag-grid-community";
import { AgGridAngular } from 'ag-grid-angular';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';
import { CotMinotaurService } from '../../../services/cot-minotaur.service';
import { MapMessagesService } from '../../../services/map-messages.service';

import {
  MapViewModel, Bounds, LatLon, TimeSpanTime, TimeSpan
} from '../../../models/map-view-model';

import {
  CotTrackModel, CotTrackFeature, CotTrackCrs, CotTrackGeometry, CotTrackProperties
} from '../../../models/cot-track-model';

/* do not use providers in component for shared services */
@Component({
  selector: 'app-cot-minotaur',
  templateUrl: './cot-minotaur.component.html',
  styleUrls: ['./cot-minotaur.component.css']
})
export class CotMinotaurComponent implements OnInit, OnDestroy {
  config: ConfigModel = null;
  mapStatusView: Subscription = null;
  trackData: any = [];

  @ViewChild('agGridCot') agGrid: AgGridAngular;
  gridApi;
  gridColumnApi;
  gridOptions: GridOptions;
  columnDefinitions: any = [];
  paginationPageSize: 25;

  rowData: any[] = [];
  cacheRowData: any[] = [];

  domLayout = "autoHeight";
  getRowNodeId;

  constructor(private configService: ConfigService,
    private cotMinotaurSerice: CotMinotaurService,
    private mapMessageService: MapMessagesService) {
    this.gridOptions = <GridOptions>{
      rowData: this.rowData,
      columnDefs: this.createColumnDefs(),
      context: {
        componentParent: this
      },
      pagination: true
    };

    this.getRowNodeId = function (data) {
      return data.id;
    };
  }

  ngOnInit() {
    this.config = this.configService.getConfig();

    // do intial get on tracks
    this.cotMinotaurSerice.getCotTracks().subscribe(
      response => {
        this.updateTrackData(response, true);
      });

    this.mapStatusView = this.mapMessageService.getMapView().subscribe(
      mapView => {
        console.log(mapView);
      });

    // start the refresh using timeout
    setTimeout(() => {
      interval(30000).pipe(
        startWith(0),
        switchMap(() => this.cotMinotaurSerice.getCotTracks())
      ).subscribe(response => {
        console.log(response);

        this.updateTrackData(response);
      });
    }, 5000);
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.mapStatusView.unsubscribe();
  }

  private updateTrackData(response: CotTrackModel, initial?: boolean) {
    console.log(response);

    if (initial) {
      this.trackData = [];

      response.features.forEach(value => {
        this.cacheRowData.push(value.id);

        this.trackData.push({
          id: value.id,
          featureType: value.geometry.type,
          name: value.properties.name,
          type: value.properties.type,
          category: value.properties.category,
          class: value.properties.class,
          alertLevel: value.properties.alertLevel,
          threat: value.properties.threat,
          dimension: value.properties.dimension,
          flag: value.properties.flag,
          speed: value.properties.speed,
          dtg: value.properties.dtg,
          altitude: value.properties.altitude,
          course: value.properties.course,
          classification: value.properties.classification
        });
      });

      this.agGrid.api.setRowData(this.trackData);
      console.log(this.trackData);
    } else {
      let addRows: any[] = [], updateRows: any[] = [], deleteRows: any[] = [];

      response.features.forEach(value => {
        if (this.cacheRowData.indexOf(value.id) >= 0) {
          updateRows.push({
            id: value.id,
            featureType: value.geometry.type,
            name: value.properties.name,
            type: value.properties.type,
            category: value.properties.category,
            class: value.properties.class,
            alertLevel: value.properties.alertLevel,
            threat: value.properties.threat,
            dimension: value.properties.dimension,
            flag: value.properties.flag,
            speed: value.properties.speed,
            dtg: value.properties.dtg,
            altitude: value.properties.altitude,
            course: value.properties.course,
            classification: value.properties.classification
          });
        } else {
          addRows.push({
            id: value.id,
            featureType: value.geometry.type,
            name: value.properties.name,
            type: value.properties.type,
            category: value.properties.category,
            class: value.properties.class,
            alertLevel: value.properties.alertLevel,
            threat: value.properties.threat,
            dimension: value.properties.dimension,
            flag: value.properties.flag,
            speed: value.properties.speed,
            dtg: value.properties.dtg,
            altitude: value.properties.altitude,
            course: value.properties.course,
            classification: value.properties.classification
          });
        }
      });

      console.log(addRows, updateRows, deleteRows);
      this.agGrid.api.updateRowData({ add: addRows, update: updateRows, remove: deleteRows });
    }
  }

  private createColumnDefs() {
    this.columnDefinitions = [
      { field: 'id', hide: true },
      { field: 'featureType', sortable: true },
      { field: 'name', sortable: true, filterable: true },
      { field: 'type', sortable: true, filterable: true },
      { field: 'category', sortable: true, filterable: true },
      { field: 'class', sortable: true, filterable: true },
      { field: 'alertLevel', sortable: true, filterable: true },
      { field: 'threat', sortable: true, filterable: true },
      { field: 'dimension', sortable: true },
      { field: 'flag', sortable: true, filterable: true },
      { field: 'speed', sortable: true },
      { field: 'dtg', sortable: true },
      { field: 'altitude', sortable: true },
      { field: 'course' },
      { field: 'classification', filterable: true }
    ];

    return this.columnDefinitions;
  }

  onGridReady(params) {
    console.log(params);
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  onFirstDataRendered(params) {
    console.log(params);
  }
}
