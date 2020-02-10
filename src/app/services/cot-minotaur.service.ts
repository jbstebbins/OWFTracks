import { Injectable } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY } from 'rxjs';
import { catchError, map, filter, switchMap, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import * as _ from 'lodash';

import { ConfigModel } from '../models/config-model';
import {
  CotTrackModel, CotTrackFeature, CotTrackCrs, CotTrackGeometry, CotTrackProperties
} from '../models/cot-track-model';

import { ConfigService } from './config.service';
import { MapMessagesService } from './map-messages.service';
import { NullTemplateVisitor } from '@angular/compiler';
import { dashCaseToCamelCase } from '@angular/animations/browser/src/util';
import { EMPTY_ARRAY } from '@angular/core/src/view';

declare var OWF: any;
declare var Ozone: any;

@Injectable({
  providedIn: 'root'
})
export class CotMinotaurService {
  trackUrl: string = 'https://localhost:4200/assets/testdata/wfs_SimpleFeature_2020JAN14.json';
  trackData: CotTrackModel = null;

  constructor(private http: HttpClient,
    private configService: ConfigService,
    private mapMessageService: MapMessagesService
  ) { }

  getConfig() {
    return this.configService.getConfig();
  }

  getCotTracks(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      observe: 'response' as 'body',
      withCredentials: true
    };

    let tracks = this.http
      .get<any>(this.trackUrl, httpOptions)
      .pipe(
        tap(res => { this.processResponse(res); }),
        map((data: any) => this.trackData = data.body),
        catchError(this.handleError('getCotTracks', [])));

    return tracks;
  }

  private processResponse(response) {
    console.log(response.headers, response.status, response.type);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}