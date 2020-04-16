import { Component, OnInit, OnDestroy, ElementRef, ChangeDetectorRef, Input, ViewChild, NgZone } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap, retry, retryWhen, delay, take } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';
import { ActionNotificationService } from '../../../services/action-notification.service';

import * as _ from 'lodash';
import { jsUtils } from '../../../library/jsUtils';
import { OwfApi } from '../../../library/owf-api';

import * as xls from 'xlsx';
import * as papa from 'papaparse';

interface Track {
  title: string;
  uuid: string;
}

@Component({
  selector: 'app-csv-core',
  templateUrl: './csv-core.component.html',
  styleUrls: ['./csv-core.component.css']
})
export class CsvCoreComponent implements OnInit, OnDestroy {
  config: ConfigModel = null;
  subscription: Subscription;

  divCSVRefreshCss = {
    'z-index': 3,
    'width': '22px',
    'height': '22px',
    'display': 'inline'
  }

  divLayerRefreshCss = {
    'z-index': 3,
    'width': '22px',
    'height': '22px',
    'display': 'inline'
  }

  layerSearchImageSrc = "/OWFTracks/assets/images/close.svg";
  layerRefreshImageSrc = "/OWFTracks/assets/images/refresh.svg";

  showZoom = true;
  layerZoomImageSrc = "/OWFTracks/assets/images/zoom_in.svg";
  divLayerZoomCss = {
    'z-index': 3,
    'width': '22px',
    'height': '22px',
    'display': 'inline'
  }
  showLabels = false;
  layerLabelImageSrc = "/OWFTracks/assets/images/label.svg";
  divLayerLabelCss = {
    'z-index': 3,
    'width': '22px',
    'height': '22px',
    'display': 'inline',
    'background-color': 'gray'
  }

  showMap = false;
  divLayerMapCss = {
    'z-index': 3,
    'width': '22px',
    'height': '22px',
    'display': 'inline'
  }

  jsutils = new jsUtils();
  owfApi = new OwfApi();

  credentialsRequired: boolean = false;
  connectionFailure: boolean = false;

  public filename: string = "";
  public color: any = "#f38c06";
  public records: any[] = [];
  public searchValue: string;
  public loadComponent: boolean = false;
  public isDataValid: boolean = false;
  public loadInitial: boolean = true;
  public loadMMSISync: boolean = false;
  public loadStatus: string = "(no file selected!)";
  @ViewChild('csvStatus') csvStatus: ElementRef;
  @ViewChild('colorPicker') colorPicker: ElementRef;
  @ViewChild('csvFileUpload') csvFileUpload: ElementRef;
  recordsLoaded = 0;
  recordsError = 0;
  recordsSelected = 0;

  layers: any[] = [{ title: "-- SELECT LAYER --", uuid: null }];
  layersDefinition: any[] = [];
  layerSelected: Track;

  constructor(private _zone: NgZone,
    private configService: ConfigService,
    private notificationService: ActionNotificationService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        //console.log(`${payload.action}, received by csv-core.component`);

        if (payload.action === "CSV LAYERSYNC ENABLED") {
          this.loadMMSISync = payload.value;
          this.cdr.detectChanges();
        } else if (payload.action === "CSV INVALID DATA") {
          this.isDataValid = !payload.value;
          this.cdr.detectChanges();
        } else if (payload.action === "CSV SELECTED COUNT") {
          this.recordsSelected = payload.value;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnInit() {
    //console.log("csv-core initialized.");
    this.config = this.configService.getConfig();

    this.layerRefreshImageSrc = this.configService.getBaseHref() + "/assets/images/refresh.svg";
    this.layerSearchImageSrc = this.configService.getBaseHref() + "/assets/images/close.svg";
    this.layerZoomImageSrc = this.configService.getBaseHref() + "/assets/images/zoom_in.svg";
    this.layerLabelImageSrc = this.configService.getBaseHref() + "/assets/images/label.svg";

    // load directory if provided
    this.getDirectoryLayers();
  }

  ngOnDestroy() {
    //console.log("csv-core destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

  private getDirectoryLayers() {
    let selectedLayer;
    this.connectionFailure = true;
    this.config.directories.forEach((directory) => {
      let directoryObserable: Observable<any> = this.http
        .get<any>(directory.path, { responseType: 'json', withCredentials: true })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError)/*, tap(console.log)*/);

      let directorySubscription = directoryObserable.subscribe(
        (directoryCollection) => {
          this.connectionFailure = false;
          directorySubscription.unsubscribe();

          directoryCollection.directory.forEach((services) => {
            // retrieve the directory and get layer list
            let layerType = "feature";
            let layerParams = this.config.layerParam.defaults;
            let layerUrl = "";
            let layerMSG, newItem;
            let urlParser, layerHost = "";
            services.layer.services.forEach((service) => {
              service["uuid"] = this.jsutils.uuidv4();
              service.tempArea = {};

              layerType = service.params.serviceType || services.layer.params.serviceType || "feature";
              if (layerType === "feature") {
                layerType = "arcgis-feature";

                // process the layer into definition

                // copy layer params from top level
                if (services.layer.params) {
                  Object.keys(services.layer.params).forEach((param) => {
                    layerParams[param] = services.layer.params[param];
                  });
                }

                // copy layer service params
                if (service.params) {
                  Object.keys(service.params).forEach((param) => {
                    layerParams[param] = service.params[param];
                  });
                }

                // cleanup params
                delete layerParams.serviceType;
                delete layerParams.url;
                delete layerParams.data;
                delete layerParams.zoom;
                delete layerParams.refresh;
                delete layerParams._comment;
                delete layerParams.intranet;

                // copy the default overrides
                if (directory.layerParam.overrides) {
                  Object.keys(directory.layerParam.overrides).forEach((param) => {
                    layerParams[param] = directory.layerParam.overrides[param];
                  });
                }

                // update service url
                layerUrl = service.url || services.properties.url;
                if ((service.params.layers !== undefined) && (service.params.layers !== null)) {
                  layerUrl = layerUrl +
                    ((layerUrl.endsWith("/")) ? "" : "/") + service.params.layers;
                }
                if ((services.properties.token !== undefined) && (services.properties.token !== null)) {
                  urlParser = new URL(layerUrl);
                  layerHost = urlParser.host;

                  // get the token if available; else parse it
                  this.config.tokenServices.forEach((service) => {
                    if ((service.serviceUrl !== undefined) && (service.serviceUrl !== null) &&
                      (service.serviceUrl === layerHost)) {
                      if (layerUrl.includes("?")) {
                        layerUrl += "&token=" + service.token;
                      } else {
                        layerUrl += "?token=" + service.token;
                      }
                    }
                  });
                }

                // create the service message for layerDefinition
                layerMSG = {};
                layerMSG.overlayId = directory.name;
                layerMSG.featureId = service.name;
                layerMSG.name = service.name;
                layerMSG.format = layerType;
                layerMSG.params = layerParams;
                if ((service.params.zoom !== undefined) || (service.params.zoom !== null)) {
                  layerMSG.zoom = service.params.zoom;
                }

                layerMSG.mapId = 1;
                layerMSG.url = layerUrl;
                layerMSG["uuid"] = service["uuid"];
                layerMSG.tempArea = {};

                // check roles to for command set option in infotemplate

                // add the new item
                newItem = { title: (layerMSG.name + "/" + layerMSG.overlayId), uuid: service.uuid };
                if (!selectedLayer) {
                  selectedLayer = newItem;
                }

                // trigger angular binding
                this.layers = [...this.layers, newItem];
                this.layersDefinition = [...this.layersDefinition, layerMSG];
              }
            });
          });
        },
        error => {
          console.log('HTTP Error', error);
        },
        () => {
          if (!this.connectionFailure) {
            //console.log('HTTP request completed.');
          } else {
            window.alert('OPS Track Widget: HTTP other layer error; not trapped.\n' +
              directory);
          }
        });
    });
  }

  sendNotification(payload) {
    this.notificationService.publisherAction(payload);
    //console.log(`${payload.action}, pressed from csv-core.component`);
  }

  fileSelectListener($event: any): void {
    this.resetGrid();
  }

  uploadListener($event: any): void {
    let files = $event.srcElement.files;
    let input = $event.target;

    this.loadMMSISync = false;
    if (this.isValidCSVFile(files[0])) {
      let reader = new FileReader();

      this.filename = input.files[0].name;
      if (input.files[0].name.endsWith("csv")) {
        reader.readAsText(input.files[0]);

        reader.onload = () => {
          let csvData = reader.result;
          let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);

          this.recordsLoaded = 0;
          this.recordsError = 0;
          this.recordsSelected = 0;

          let parsedValue;
          let count = 0, error = 0;
          csvRecordsArray.forEach((value) => {
            parsedValue = papa.parse(value);

            if (parsedValue.errors[0] !== undefined) {
              error++;
            } else {
              count++;
              this.records.push(parsedValue.data[0]);
            }
          });

          this.recordsLoaded = count;
          this.recordsError = error;
          this.loadStatus = "(records loaded: " + count + ", error: " + error + ")";
          this.loadComponent = true;
          this.loadInitial = false;

          input.value = '';
        };

        reader.onerror = function () {
          console.log('error is occured while reading file!');
        };
      } else {
        reader.readAsArrayBuffer(input.files[0]);
        reader.onload = () => {
          let xlsData: ArrayBuffer = <ArrayBuffer>reader.result;
          var data = new Uint8Array(xlsData);
          var workbook = xls.read(data, { type: 'array' });
          var firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          // header: 1 instructs xlsx to create an 'array of arrays'
          var result = xls.utils.sheet_to_json(firstSheet, { header: 1 });

          // data preview
          let count = 0, error = 0;
          result.forEach((item, index) => {
            count++;
            this.records.push(item);
          });

          this.loadStatus = "(records loaded: " + count + ", error: " + error + ")";
          this.loadComponent = true;
          this.loadInitial = false;

          input.value = '';
        };
      }
    } else {
      alert("Please import valid .csv file.");
      this.resetGrid();
    }
  }

  searchListener($event: any): void {
    if ($event.key === "Enter") {
      this.searchValue = (this.searchValue + "").trim();
      this.notificationService.publisherAction({ action: 'CSV SEARCH VALUE', value: this.searchValue });

      if (this.searchValue === "") {
        this.recordsSelected = 0;
      }
    }
  }

  handleZoomClick($event: any): void {
    this.showZoom = !this.showZoom;
    this.divLayerZoomCss["background-color"] = (this.showZoom ? "unset" : "gray");
  }

  handleLabelClick($event: any): void {
    this.showLabels = !this.showLabels;
    this.divLayerLabelCss["background-color"] = (this.showLabels ? "unset" : "gray");
  }

  handleMapClick($event: any): void {
    //this.showMap = !this.showMap;
    //this.divLayerMapCss["background-color"] = (this.showMap ? "unset" : "gray");

    //if (this.showMap) {
      this.notificationService.publisherAction({ action: 'CSV PLOT ON MAP', value: { showLabels: this.showLabels, color: this.color, showZoom: this.showZoom } });
    //} else {
    //  this.owfApi.sendChannelRequest("map.feature.unplot", {
    //    overlayId: "CSV-Viewer", featureId: this.filename
    //  });
    //}
  }

  handleResetClick($event: any): void {
    this.loadComponent = false;
    this.isDataValid = false;
    this.loadInitial = true;
  }

  handleShareClick($event: any): void {
    // this.showMap = true;
    // this.divLayerMapCss["background-color"] = (this.showMap ? "unset" : "gray");
    
    this.notificationService.publisherAction({ action: 'CSV SAVE TO CATALOG', value: { showLabels: this.showLabels, color: this.color, showZoom: this.showZoom } });
  }

  isValidCSVFile(file: any) {
    return (!file ? false : (file.name.endsWith(".csv") || file.name.endsWith(".xls") || file.name.endsWith(".xlsx")));
  }

  resetGrid() {
    this.records = [];

    this.csvFileUpload.nativeElement.value = '';
    this.loadComponent = false;
    this.cdr.detectChanges();

    this.loadStatus = "(no file selected!)";
  }

  refreshCSV($event) {
    this.searchValue = "";
    this.notificationService.publisherAction({ action: 'CSV SEARCH VALUE', value: "" });

    this.recordsSelected = 0;
  }

  colorPickerSpanClicked($event) {
    let element: any = this.colorPicker;
    let frame = element.el.nativeElement.children[0].children[1];
    frame.style.position = 'fixed';
    frame.style.top = '83px';
    frame.style.left = 'unset';
    frame.style.right = '0px';
  }

  selectedLayer($event: any): void {
    this.layerSelected = $event.value;

    // change ui state and force change
    if (this.layerSelected.title !== "-- SELECT LAYER --") {
      this.layersDefinition.forEach((value, index) => {
        if (value.uuid === this.layerSelected.uuid) {
          this.notificationService.publisherAction({ action: 'CSV LAYERSYNC LAYERINFO', value: value });
        }
      });
    }
  }

  refreshLayer($event) {
    this.selectedLayer({ originalEvent: null, value: this.layerSelected });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(errorMessage);
  }
}
