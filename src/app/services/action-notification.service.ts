import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActionNotificationService {
  // Observable string sources
  private publisherSource = new Subject<string>();
  private subscriberSource = new Subject<string>();

  // Observable string streams
  publisher$ = this.publisherSource.asObservable();
  subscriber$ = this.subscriberSource.asObservable();

  constructor() { }

  // Service message commands
  publisherAction(item: string) {
    this.publisherSource.next(item);
  }

  subscriberAction(item: string) {
    this.subscriberSource.next(item);
  }
}