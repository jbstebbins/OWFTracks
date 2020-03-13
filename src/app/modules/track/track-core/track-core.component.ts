import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ConfigModel } from '../../../models/config-model';
import { ConfigService } from '../../../services/config.service';
import { ActionNotificationService } from '../../../services/action-notification.service';

@Component({
  selector: 'app-track-core',
  templateUrl: './track-core.component.html',
  styleUrls: ['./track-core.component.css']
})
export class TrackCoreComponent implements OnInit, OnDestroy {
  config: ConfigModel = null;
  subscription: Subscription;

  constructor(private configService: ConfigService,
    private notificationService: ActionNotificationService) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}, received by track-core.component`);
      }
    );
  }

  ngOnInit() {
    console.log("track-core initialized.");
  }

  ngOnDestroy() {
    console.log("track-core destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

  sendNotification(payload) {
    this.notificationService.subscriberAction(payload);
    console.log(`${payload.action}, pressed from track-core.component`);
  }

}
