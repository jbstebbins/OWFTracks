import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ActionNotificationService } from '../../../services/action-notification.service';

import { jsUtils } from '../../../library/jsUtils';
import * as xls from 'xls';
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
  public loadComponent = false;

  public records: any[] = [];
  @ViewChild('csvReader') csvReader: any;

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

    if (this.isValidCSVFile(files[0])) {
      let input = $event.target;
      let reader = new FileReader();

      /* 
      xls.parse('data.xls', function(error, data) {
	      console.log(data);
      });
      */
      this.resetGrid();

      if (input.files[0].name.endsWith("csv")) {
        reader.readAsText(input.files[0]);

        reader.onload = () => {
          let csvData = reader.result;
          let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);

          let parsedValue;
          csvRecordsArray.forEach((value) => {
            parsedValue = papa.parse(value);
            this.records.push(parsedValue.data[0]);
          });

          this.loadComponent = true;
        };

        reader.onerror = function () {
          console.log('error is occured while reading file!');
        };
      } else {

      }
    } else {
      alert("Please import valid .csv file.");
      this.resetGrid();
    }
  }

  isValidCSVFile(file: any) {
    return (!file ? false : (file.name.endsWith(".csv") || file.name.endsWith(".xls") || file.name.endsWith(".xlsx")));
  }

  resetGrid() {
    this.records = [];
    this.loadComponent = false;
  }
}
