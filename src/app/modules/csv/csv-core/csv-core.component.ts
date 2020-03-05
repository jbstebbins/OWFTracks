import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ActionNotificationService } from '../../../services/action-notification.service';

import { jsUtils } from '../../../library/jsUtils';
import * as xls from 'xlsx';
import * as papa from 'papaparse';

@Component({
  selector: 'app-csv-core',
  templateUrl: './csv-core.component.html',
  styleUrls: ['./csv-core.component.css']
})
export class CsvCoreComponent implements OnInit {

  jsutils = new jsUtils();
  subscription: Subscription;

  public parentMessage: string;
  public loadComponent: boolean = false;
  public loadStatus: string = "(no file selected!)";

  public records: any[] = [];
  @ViewChild('csvStatus') csvStatus: ElementRef;
  @ViewChild('csvFileUpload') csvFileUpload: ElementRef;

  constructor(private notificationService: ActionNotificationService) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}, received by csv-core.component`);
      }
    );
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

  sendNotification(payload) {
    this.notificationService.subscriberAction(payload);
    console.log(`${payload.action}, pressed from csv-core.component`);
  }

  uploadListener($event: any): void {
    let files = $event.srcElement.files;
    let input = $event.target;

    /* 
    xls.parse('data.xls', function(error, data) {
      console.log(data);
    });
    */
    this.resetGrid();

    if (this.isValidCSVFile(files[0])) {
      let reader = new FileReader();

      if (input.files[0].name.endsWith("csv")) {
        reader.readAsText(input.files[0]);

        reader.onload = () => {
          let csvData = reader.result;
          let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);

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
            console.log(item);
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
    console.log($event);
  }

  isValidCSVFile(file: any) {
    return (!file ? false : (file.name.endsWith(".csv") || file.name.endsWith(".xls") || file.name.endsWith(".xlsx")));
  }

  resetGrid() {
    this.records = [];
    this.loadComponent = false;
    this.loadStatus = "(no file selected!)";
  }
}
