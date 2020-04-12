import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators'

import * as _ from 'lodash';
import { OwfApi } from '../../../library/owf-api';

import { GridOptions } from "ag-grid-community";
import { AgGridAngular } from 'ag-grid-angular';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';
import { CotMinotaurService } from '../../../services/cot-minotaur.service';
import { MapMessagesService } from '../../../services/map-messages.service';
import { ActionNotificationService } from '../../../services/action-notification.service';

import {
  MapViewModel, Bounds, LatLon, TimeSpanTime, TimeSpan
} from '../../../models/map-view-model';

import {
  CotTrackModel, CotTrackFeature, CotTrackCrs, CotTrackGeometry, CotTrackProperties
} from '../../../models/cot-track-model';

import { CotToKmlWorker } from '../web-workers/cot-to-kml.worker';

/* do not use providers in component for shared services */
@Component({
  selector: 'app-cot-minotaur',
  templateUrl: './cot-minotaur.component.html',
  styleUrls: ['./cot-minotaur.component.css']
})
export class CotMinotaurComponent implements OnInit, OnDestroy {
  config: ConfigModel = null;
  subscription: Subscription;
  mapStatusView: Subscription = null;

  owfApi = new OwfApi();
  worker: CotToKmlWorker;

  trackStatusInitial: Subscription = null;
  trackStatusInterval: Subscription = null;
  trackData: any = [];

  @ViewChild('agGridCot') agGrid: AgGridAngular;
  mapView: any;

  gridApi;
  gridColumnApi;
  getRowNodeId;
  gridOptions: GridOptions;
  columnDefinitions: any = [];
  paginationPageSize: 25;

  rowData: any[] = [];
  cacheRowData: any[] = [];

  domLayout = "normal";
  rowSelection = "single";

  extent: any = "-3.108922936594193,-147.85116261717408," +
    "61.631880192109456,-62.06991261719688";
  shutdown:boolean = false;

  constructor(private configService: ConfigService,
    private cotMinotaurSerice: CotMinotaurService,
    private mapMessageService: MapMessagesService,
    private notificationService: ActionNotificationService) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}, received by cot-minotaur.component`);
      }
    );

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
    console.log("cot-minotaur initialized.");
    this.config = this.configService.getConfig();

    this.mapStatusView = this.mapMessageService.getMapStatusView().subscribe(
      mapView => {
        this.mapView = mapView;

        // do intial get on tracks on view change
        if (this.mapView.mapId === 1) {
          this.extent = mapView.bounds.southWest.lat + "," + mapView.bounds.northEast.lat + "," +
            mapView.bounds.southWest.lon + "," + mapView.bounds.northEast.lon;
        }

        if (this.trackStatusInitial) {
          this.trackStatusInitial.unsubscribe();
        }

        this.trackStatusInitial = this.cotMinotaurSerice.getCotTracks(this.config.Urls["TrackCount"], this.extent).subscribe(
          response => {
            this.updateTrackData(response, true);

            // remove old interval subscription and start new one
            if (this.trackStatusInterval) {
              this.trackStatusInterval.unsubscribe();
            }

            setTimeout(() => {
              this.trackStatusInterval = interval(this.config.Urls["RefreshRate"]).pipe(
                startWith(0),
                switchMap(() => this.cotMinotaurSerice.getCotTracks("randomize", this.extent))
              ).subscribe(response => {
                if ((this.shutdown === undefined) || (this.shutdown)) {
                  this.trackStatusInterval.unsubscribe();
                } else {
                  this.updateTrackData(response);
                }
              });
            }, 5000);
          });
      });

    // create inline worker
    this.worker = new CotToKmlWorker(() => {
      // START OF WORKER THREAD CODE
      const styleMatrix = {
        air: {
          AIR: "air_air",
          FRD: "air_frd",
          LND: "air_lnd",
          NEU: "air_neu",
          PND: "air_pnd",
          UNK: "air_unk",
        }, ground: {
          AIR: "ground_air",
          FRD: "ground_frd",
          LND: "ground_lnd",
          NEU: "ground_neu",
          PND: "ground_pnd",
          UNK: "ground_unk",
        }, seasurface: {
          AIR: "seasurface_air",
          FRD: "seasurface_frd",
          LND: "seasurface_lnd",
          NEU: "seasurface_neu",
          PND: "seasurface_pnd",
          UNK: "seasurface_unk",
        }, missle: {
          AIR: "missle_air",
          FRD: "missle_frd",
          LND: "missle_lnd",
          NEU: "missle_neu",
          PND: "missle_pnd",
          UNK: "missle_unk",
        }, ufo: {
          AIR: "ufo_air",
          FRD: "ufo_frd",
          LND: "ufo_lnd",
          NEU: "ufo_neu",
          PND: "ufo_pnd",
          UNK: "ufo_unk",
        }, unk: {
          AIR: "unk_air",
          FRD: "unk_frd",
          LND: "unk_lnd",
          NEU: "unk_neu",
          PND: "unk_pnd",
          UNK: "unk_unk",
        }
      };

      const kmlHeader = "<kml xmlns=\"http://www.opengis.net/kml/2.2\"> " +
        "<Document> " +
        "    <name>StyleMap.kml</name> " +
        "    <open>1</open> ";
      const kmlFooter = "</Document></kml>";
      const kmlStyles =
        "      <Style id=\"air_air\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/air_air.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"air_frd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/air_frd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"air_lnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/air_lnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"air_neu\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/air_neu.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"air_pnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/air_pnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"air_unk\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/air_unk.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ground_air\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ground_air.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ground_frd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ground_frd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ground_lnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ground_lnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ground_neu\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ground_neu.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ground_pnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ground_pnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ground_unk\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ground_unk.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"missle_air\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/missle_air.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"missle_frd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/missle_frd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"missle_lnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/missle_lnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"missle_neu\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/missle_neu.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"missle_pnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/missle_pnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"missle_unk\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/missle_unk.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"seasurface_air\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/seasurface_air.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"seasurface_frd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/seasurface_frd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"seasurface_lnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/seasurface_lnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"seasurface_neu\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/seasurface_neu.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"seasurface_pnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/seasurface_pnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"seasurface_unk\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/seasurface_unk.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ufo_air\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ufo_air.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ufo_frd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ufo_frd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ufo_lnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ufo_lnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ufo_neu\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ufo_neu.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ufo_pnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ufo_pnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"ufo_unk\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/ufo_unk.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"unk_air\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/unk_air.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"unk_frd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/unk_frd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"unk_lnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/unk_lnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"unk_neu\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/unk_neu.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"unk_pnd\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/unk_pnd.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
        "      <Style id=\"unk_unk\"><IconStyle><scale>2.0</scale><Icon><href>" + this.configService.getBaseHref() + "/assets/images/unk_unk.png</href></Icon></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style>";

      const plotMessage = {
        "overlayId": "Tracks",
        "featureId": "Minotaur",
        "feature": undefined,
        "name": "Minotaur",
        "zoom": false,
        "mapId": 1
      };

      const getTrackStyle = (type, threat) => {
        let style = "";

        if (type === "AIR TRACK") {
          style = styleMatrix.air[threat];
        } else if (type === "GROUND TRACK") {
          style = styleMatrix.ground[threat];
        } else if (type === "SEA SURFACE TRACK") {
          style = styleMatrix.seasurface[threat];
        } else if (type === "MISSLE TRACK") {
          style = styleMatrix.missle[threat];
        } else if (type === "UFO") {
          style = styleMatrix.ufo[threat];
        } else {
          style = styleMatrix.unk[threat];
        }

        return style;
      };

      const formatKml = (data) => {
        let tracks = data.tracks;

        // format and return to main thread

        // if initial
        if (tracks.initial !== undefined) {
          let kmlPayload = "";
          tracks.initial.forEach(track => {
            kmlPayload += "<Placemark> " +
              "<name>" + track.name + "</name> " +
              "<id>" + track.id + "</id> " +
              "<styleUrl>#" + getTrackStyle(track.type, track.threat) + "</styleUrl> " +
              "<Point><coordinates>" + track.lon + "," + track.lat + "," + track.altitude + "</coordinates></Point></Placemark> "
          });

          plotMessage.feature = kmlHeader + kmlStyles + kmlPayload + kmlFooter;
        } else {
          // if add/update/remove
          plotMessage.feature = {};
          let addTracks = "";

          tracks.add.forEach(track => {
            addTracks += "<Placemark> " +
              "<name>" + track.name + "</name> " +
              "<id>" + track.id + "</id> " +
              "<styleUrl>#" + getTrackStyle(track.type, track.threat) + "</styleUrl> " +
              "<Point><coordinates>" + track.lon + "," + track.lat + "," + track.altitude + "</coordinates></Point></Placemark> "
          });
          plotMessage.feature["add"] = kmlHeader + addTracks + kmlFooter;

          let updateTracks = "";
          tracks.update.forEach(track => {
            updateTracks += "<Placemark> " +
              "<name>" + track.name + "</name> " +
              "<id>" + track.id + "</id> " +
              "<styleUrl>#" + getTrackStyle(track.type, track.threat) + "</styleUrl> " +
              "<Point><coordinates>" + track.lon + "," + track.lat + "," + track.altitude + "</coordinates></Point></Placemark> "
          });
          plotMessage.feature["update"] = kmlHeader + updateTracks + kmlFooter;

          plotMessage.feature["remove"] = tracks.remove;
        }

        // this is from DedicatedWorkerGlobalScope ( because of that we have postMessage and onmessage methods )
        // and it can't see methods of this class
        // @ts-ignore
        postMessage({
          status: "kml formatting complete", kml: plotMessage
        });

        // delete the allocated memory
        if (plotMessage.feature.hasOwnProperty("add")) {
          delete plotMessage.feature.add;
        }
        if (plotMessage.feature.hasOwnProperty("update")) {
          delete plotMessage.feature.update;
        }
        if (plotMessage.feature.hasOwnProperty("remove")) {
          delete plotMessage.feature.remove;
        }
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
    console.log("cot-minotaur destroyed.");
    this.shutdown = true;

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();

    // prevent memory leak when component destroyed
    if (this.mapStatusView) {
      this.mapStatusView.unsubscribe();
    }
    if (this.trackStatusInitial) {
      this.trackStatusInitial.unsubscribe();
    }
    if (this.trackStatusInterval) {
      this.trackStatusInterval.unsubscribe();
    }

    if (this.worker) {
      this.worker.terminate();
    }
  }

  private updateTrackData(response: CotTrackModel, initial?: boolean) {
    if (initial) {
      this.trackData = [];

      response.features.forEach(value => {
        if (this.cacheRowData.indexOf(value.id) < 0) {
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
            lat: value.geometry.coordinates[0],
            lon: value.geometry.coordinates[1],
            classification: value.properties.classification
          });
        } else {
          console.log("duplicate row on initial, " + value.id);
        }
      });

      this.agGrid.api.setRowData(this.trackData);
      this.sendToMap({ initial: this.trackData });
    } else {
      let addRows: any[] = [], updateRows: any[] = [], removeRows: any[] = [];
      let addRowsID: any[] = [], updateRowsID: any[] = [];

      response.features.forEach(value => {
        let index = this.cacheRowData.indexOf(value.id);
        if (index < 0) {
          this.cacheRowData.push(value.id);

          addRowsID.push(value.id);
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
            lat: value.geometry.coordinates[0],
            lon: value.geometry.coordinates[1],
            classification: value.properties.classification
          });
        } else {
          if (value.geometry.type === "remove") {
            this.cacheRowData.splice(index, 1);
            removeRows.push({
              id: value.id
            });
          } else {
            updateRowsID.push(value.id);
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
              lat: value.geometry.coordinates[0],
              lon: value.geometry.coordinates[1],
              classification: value.properties.classification
            });
          }
        }
      });

      updateRowsID.forEach(value => {
        if (addRowsID.indexOf(value) >= 0) {
          console.log("update row in add collection, " + value);
        }
      });

      response.removed.forEach(value => {
        if (addRowsID.indexOf(value) >= 0) {
          console.log("delete row is also being added, " + value);
        }
        if (updateRowsID.indexOf(value) >= 0) {
          console.log("delete row is also being updated, " + value);
        }

        let index = this.cacheRowData.indexOf(value);
        if (index < 0) {
          console.log("delete index not found, " + value);
        } else {
          let id: any[] = this.cacheRowData.splice(index, 1);
          if (id.indexOf(value) < 0) {
            console.log("deleted item index is incorrect; ", id, value);
          } else {
            removeRows.push({
              id: value
            });
          }
        }
      });

      this.agGrid.api.updateRowData({ add: addRows, update: updateRows, remove: removeRows });
      this.sendToMap({ add: addRows, update: updateRows, remove: removeRows });
    }
  }

  private createColumnDefs() {
    this.columnDefinitions = [
      { field: 'id', hide: true },
      { field: 'featureType', sortable: true, resizable: true },
      { field: 'name', sortable: true, filter: true, resizable: true },
      { field: 'type', sortable: true, filter: true, resizable: true },
      { field: 'category', sortable: true, filter: true, resizable: true },
      { field: 'class', sortable: true, filter: true, resizable: true },
      { field: 'alertLevel', sortable: true, filter: true, resizable: true },
      { field: 'threat', sortable: true, filter: true, resizable: true },
      { field: 'dimension', sortable: true, resizable: true },
      { field: 'flag', sortable: true, filter: true, resizable: true },
      { field: 'speed', sortable: true, resizable: true },
      { field: 'dtg', sortable: true, resizable: true },
      { field: 'altitude', sortable: true, resizable: true },
      { field: 'course', hide: true, resizable: true },
      { field: 'lat', hide: true, resizable: true },
      { field: 'lon', hide: true, resizable: true },
      { field: 'classification', filter: true, resizable: true }
    ];

    return this.columnDefinitions;
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  onFirstDataRendered(params) {
  }

  sendToMap(tracks) {
    this.worker.postMessage({ tracks: tracks });
  }

  paginationNumberFormatter(params) {
    return "[" + params.value.toLocaleString() + "]";
  }

  onSelectionChanged() {
    var selectedRows = this.gridApi.getSelectedRows();
    console.log(selectedRows);
  }
}
