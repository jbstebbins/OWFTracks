import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators'

import { AngularGridInstance, Column, GridOption } from 'angular-slickgrid';

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
  configReady: boolean = false;
  config: ConfigModel = null;
  mapStatusView: Subscription = null;
  trackData: any = [];

  angularGrid: AngularGridInstance = null;
  gridObject: any;
  dataViewObj: any;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};

  constructor(private configService: ConfigService,
    private cotMinotaurSerice: CotMinotaurService,
    private mapMessageService: MapMessagesService) { 
      this.prepareGrid();
    }

  ngOnInit() {
    this.configService.getConfig()
      .subscribe(configModel => {
        this.config = configModel;
        this.configReady = true;

        console.log('Config Service completed: ', configModel);

        // do intial get on tracks
        this.cotMinotaurSerice.getCotTracks().subscribe(
          response => {
            this.updateTrackData(response, true);
          });
        /*
        interval(5000).pipe(
          startWith(0),
          switchMap(() => this.cotMinotaurSerice.getCotTracks())
        ).subscribe(response => {
          console.log(response);

          this.updateTrackData(response);
        });
        */

        this.mapStatusView = this.mapMessageService.getMapView().subscribe(
          mapView => {
            console.log(mapView);
          });
      });
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

      console.log(this.trackData);
    }
  }

  private prepareGrid() {
    this.columnDefinitions = [
      { id: 'featureType', name: 'Feature', field: 'featureType', sortable: true },
      { id: 'name', name: 'Name', field: 'name', sortable: true, filterable: true },
      { id: 'type', name: 'Type', field: 'type', sortable: true, filterable: true },
      { id: 'category', name: 'Category', field: 'category', sortable: true, filterable: true },
      { id: 'class', name: 'Class', field: 'class', sortable: true, filterable: true },
      { id: 'alertLevel', name: 'AlertLevel', field: 'alertLevel', sortable: true, filterable: true },
      { id: 'threat', name: 'Threat', field: 'threat', sortable: true, filterable: true },
      { id: 'dimension', name: 'Dimension', field: 'dimension', sortable: true },
      { id: 'flag', name: 'Flag', field: 'flag', sortable: true, filterable: true },
      { id: 'speed', name: 'Speed', field: 'speed', sortable: true },
      { id: 'dtg', name: 'DTG', field: 'dtg', sortable: true },
      { id: 'altitude', name: 'Altitude', field: 'altitude', sortable: true },
      { id: 'course', name: 'Course', field: 'course' },
      { id: 'classification', name: 'Classification', field: 'classification', filterable: true }
    ];

    this.gridOptions = {
      enableAutoResize: true,
      enableAutoSizeColumns: false,
      enableSorting: true,
      enableFiltering: true,
      enablePagination: true
    };
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridObject = angularGrid.slickGrid;
    this.dataViewObj = angularGrid.dataView;
  }
}
