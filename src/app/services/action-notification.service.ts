import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActionNotificationService {
  // Observable string sources
  private publisherSource = new Subject<any>();
  private subscriberSource = new Subject<any>();

  // Observable string streams
  publisher$ = this.publisherSource.asObservable();
  subscriber$ = this.subscriberSource.asObservable();

  constructor() { }

  // Service message commands
  publisherAction(item: any) {
    this.publisherSource.next(item);
  }

  subscriberAction(item: any) {
    this.subscriberSource.next(item);
  }
}