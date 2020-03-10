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

  divRereshCss = {
    'z-index': 3,
    'background-color': '#f1f1f1',
    'border': '1px solid #d3d3d3',
    'float': 'right',
    'position': 'absolute',
    'right': '80%'
  }

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
  @ViewChild('gridRemove') gridRemove: ElementRef;
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
    private preferencesService: PreferencesService,
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

          // skip self-adding of layers
          if (layerDefinition.overlayId !== "LYR-Monitor") {
            // check for duplication
            let duplicate = false;
            this.layers.forEach((value, index) => {
              if (value.title === (layerDefinition.name + "/" + layerDefinition.overlayId)) {
                duplicate = true;
                console.log("duplicate layer - " + value.title + "/layer not added.");
              }
            });

            let newItem = { title: (layerDefinition.name + "/" + layerDefinition.overlayId), uuid: layerDefinition.uuid };

            if (!duplicate) {
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
  }

  private createColumnDefs() {
    this.columnDefinitionsMonitor = [
      { field: 'id', hide: true },
      { field: 'title', sortable: true, dndSource: true },
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
    let deleteId;
    this.rowDataMonitor.forEach((row, index) => {
      if (row.id === data.id) {
        deleteId = index;
      }
    });

    // delete the record
    if (deleteId) {
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

    let plotMessage = {};
    let value;
    Object.keys(services).forEach((layer) => {
      value = services[layer];

      plotMessage = {
        "overlayId": "LYR-Monitor",
        "featureId": "LYR-Monitor_" + value.service.featureId,
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

      this.owfApi.sendChannelRequest("map.feature.plot.url", plotMessage);
    });

    // save the current state of the active list
    let saveSettingsObservable: Observable<any> = this.preferencesService.setPreference("track.search.filter",
      "active.state", this.rowDataMonitor);
    let saveSettings = saveSettingsObservable.subscribe(model => {
      saveSettings.unsubscribe();
    });
  }
}
