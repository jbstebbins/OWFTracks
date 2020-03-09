import { Component, OnInit, OnDestroy, ElementRef, ChangeDetectorRef, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap } from 'rxjs/operators';

import { GridOptions } from "ag-grid-community";
import { AllCommunityModules, Module } from "@ag-grid-community/all-modules";

import { AgGridAngular } from 'ag-grid-angular';

import * as _ from 'lodash';
import { jsUtils } from '../../../library/jsUtils';
import { OwfApi } from '../../../library/owf-api';

import { ActionNotificationService } from '../../../services/action-notification.service';

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
  subscription: Subscription;
  mapFeaturePlotUrl: Subscription = null;

  jsutils = new jsUtils();
  owfApi = new OwfApi();

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
  layerDefinition: any;
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
    private cdr: ChangeDetectorRef) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}, received by features-core.component`);

        if (payload.action === "LYR TOTAL COUNT") {
          this.layerRecords = payload.value;
        } else if (payload.action === "LYR PARTIAL DATA") {
          this.layerPartial = payload.value;
        } else if (payload.action === "LYR ALL DATA") {
          this.layerPartial = this.layerRecords;
        } else if (payload.action === "LYR FIELD LIST") {
          console.log(payload);
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
    console.log(this.configService.memoryPersistence);

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

          // check for duplication
          let duplicate = false;
          this.layers.forEach((value, index) => {
            if (value.title === layerDefinition.name) {
              duplicate = true;
              console.log("duplicate layer - " + value.title + "/layer not added.");
            }
          });

          let newItem = { title: layerDefinition.name, uuid: layerDefinition.uuid };

          if (!duplicate) {
            // trigger angular binding
            this.layers = [...this.layers, newItem];
            this.layersDefinition = [...this.layersDefinition, layerDefinition];

            // save to memory for recall
            this.configService.setMemoryValue("layers", this.layers);
            this.configService.setMemoryValue("layersDefinition", this.layersDefinition);

            console.log(this.configService.memoryPersistence);
            // if first time
            if (this.layers.length === 1) {
              this.selectedLayer({ originalEvent: null, value: newItem });
            } else {
              this.loadComponent = true;
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
  }

  private createColumnDefs() {
    this.columnDefinitionsMonitor = [
      { field: 'id', hide: true },
      { field: 'title', sortable: true },
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
  }

  onFirstDataRendered(params) {
  }

  paginationNumberFormatter(params) {
    return "[" + params.value.toLocaleString() + "]";
  }

  onSelectionChanged() {
    var selectedRows = this.gridApi.getSelectedRows();
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
    console.log($event.value, this.layerSelected);

    this.layerSelected = $event.value;
    this.configService.setMemoryValue("layerSelected", this.layerSelected);

    // change ui state and force change
    this.loadComponent = false;
    this.cdr.detectChanges();

    this.layersDefinition.forEach((value, index) => {
      console.log(value.uuid, this.layerSelected.uuid);
      if (value.uuid === this.layerSelected.uuid) {
        console.log("------");
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
    }
  }

  gridDrop(event) {
    event.preventDefault();

    var userAgent = window.navigator.userAgent;
    var isIE = userAgent.indexOf('Trident/') >= 0;
    var jsonData = event.dataTransfer.getData(isIE ? 'text' : 'application/json');
    var data = JSON.parse(jsonData);

    console.log(this.layersDefinition, this.layerSelected);
    console.log(this.layerFieldsId, this.layerFieldsTitle, data);
    /*
    // if data missing or data has no it, do nothing
    if (!data || data.id == null) {
        return;
    }

    var gridApi = grid == 'left' ? this.leftGridOptions.api : this.rightGridOptions.api;

    // do nothing if row is already in the grid, otherwise we would have duplicates
    var rowAlreadyInGrid = !!gridApi.getRowNode(data.id);
    if (rowAlreadyInGrid) {
        console.log('not adding row to avoid duplicates in the grid');
        return;
    }

    var transaction = {
        add: [data]
    };
    //gridApi.updateRowData(transaction);
    */
  }
}
