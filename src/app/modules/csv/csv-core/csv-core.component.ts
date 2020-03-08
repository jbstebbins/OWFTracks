import { Component, ChangeDetectorRef, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ActionNotificationService } from '../../../services/action-notification.service';

import * as xls from 'xlsx';
import * as papa from 'papaparse';

@Component({
  selector: 'app-csv-core',
  templateUrl: './csv-core.component.html',
  styleUrls: ['./csv-core.component.css']
})
export class CsvCoreComponent implements OnInit, OnDestroy {

  subscription: Subscription;

  public filename: string = "";
  public color: any = "#f38c06";
  public records: any[] = [];
  public searchValue: string;
  public loadComponent: boolean = false;
  public isDataValid: boolean = true;
  public loadStatus: string = "(no file selected!)";
  @ViewChild('csvStatus') csvStatus: ElementRef;
  @ViewChild('csvFileUpload') csvFileUpload: ElementRef;
  recordsLoaded = 0;
  recordsError = 0;
  recordsSelected = 0;

  constructor(private notificationService: ActionNotificationService,
    private cdr: ChangeDetectorRef) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}, received by csv-core.component`);

        if (payload.action === "CSV INVALID DATA") {
          this.isDataValid = !payload.value;
        }
      });
  }

  ngOnInit() {
    console.log("csv-core initialized.");
  }

  ngOnDestroy() {
    console.log("csv-core destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

  sendNotification(payload) {
    this.notificationService.subscriberAction(payload);
    console.log(`${payload.action}, pressed from csv-core.component`);
  }

  fileSelectListener($event: any): void {
    this.resetGrid();
  }

  uploadListener($event: any): void {
    let files = $event.srcElement.files;
    let input = $event.target;
    
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
        }
      }
    } else {
      alert("Please import valid .csv file.");
      this.resetGrid();
    }
  }

  searchListener($event: any): void {
    if ($event.key === "Enter") {
      this.searchValue = $event.target.value;
      this.notificationService.publisherAction({ action: 'CSV SEARCH VALUE', value: this.searchValue });
    }
  }

  handleClick($event: any): void {
    this.notificationService.publisherAction({ action: 'CSV PLOT ON MAP', value: { color: this.color } });
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
}
