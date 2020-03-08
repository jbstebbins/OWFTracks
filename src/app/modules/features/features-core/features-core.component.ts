import { Component, ChangeDetectorRef, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { SelectItem } from 'primeng/api';

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

  layers: any[] = [];
  layersData: any[] = [];
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

          let fields = payload.value.split(",");
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
      }
    );
  }

  ngOnInit() {
    console.log("features-core initialized.");
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
            this.layersData = [...this.layersData, layerDefinition];

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

    // change ui state and force change
    this.loadComponent = false;
    this.cdr.detectChanges();

    this.layersData.forEach((value, index) => {
      if (value.uuid === this.layerSelected.uuid) {
        this.layer = value;
        this.loadComponent = true;
      }
    });
  }
}
