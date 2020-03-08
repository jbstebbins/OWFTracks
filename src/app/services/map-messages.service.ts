import { Injectable } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY } from 'rxjs';

import * as _ from 'lodash';
import { OwfApi } from '../library/owf-api';

import {
  MapViewModel, Bounds, LatLon, TimeSpanTime, TimeSpan
} from '../models/map-view-model';

declare var OWF: any;
declare var Ozone: any;

@Injectable({
  providedIn: 'root'
})
export class MapMessagesService {
  owfapi = new OwfApi();
  mapStatusView: Observable<MapViewModel> = null;
  mapFeaturePlotUrl: Observable<MapViewModel> = null;

  constructor() {
    this.subscribeChannels();
  }

  private subscribeChannels() {
    this.mapStatusView = new Observable<MapViewModel>((observer) => {
      this.owfapi.addChannelSubscription('map.status.view', this.receiveMapStatusView.bind(this, observer));
      this.owfapi.requestMapViewStatus();
    });    

    this.mapFeaturePlotUrl = new Observable<any>((observer) => {
      this.owfapi.addChannelSubscription('map.feature.plot.url', this.receiveMapFeaturePlotUrl.bind(this, observer));
    });    
  }

  getMapStatusView(): Observable<MapViewModel> {
    return this.mapStatusView;
  }

  receiveMapStatusView(observer, sender, msg, channel) {
    let message = JSON.parse(msg);

    let mBounds = new Bounds(message.bounds.southWest, message.bounds.northEast);
    let mCenter = new LatLon(message.center.lat, message.center.lon);

    let mTime = null;
    if (message.timeExtent) {
      let mTimeSpan = new TimeSpan(message.timeExtent.begin, message.timeExtent.end);
      let mTimeSpans: TimeSpan[] = null;
      if (message.timeExtent.timeSpans) {
        mTimeSpans = [];

        message.timeExtent.timeSpans.array.forEach(element => {
          let ts = new TimeSpan(element.begin, element.end);
          mTimeSpans.push(ts);
        });
      }

      mTime = new TimeSpanTime(mTimeSpan, mTimeSpans, message.timeExtent.timeStamp);
    }

    let mapStatusView = new MapViewModel(mBounds, mCenter, message.range, message.scale,
      message.zoom, message.basemap, message.spatialReference.wkid, message.coordinateFormat,
      message.mapId, message.requester, mTime);

    observer.next(mapStatusView);
  }

  getMapFeaturePlotUrl(): Observable<any> {
    return this.mapFeaturePlotUrl;
  }

  receiveMapFeaturePlotUrl(observer, sender, msg, channel) {
    let message = JSON.parse(msg);

    observer.next(message);
  }
}
