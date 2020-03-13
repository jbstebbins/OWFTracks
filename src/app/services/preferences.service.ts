import { Injectable } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY } from 'rxjs';
import { catchError, map, filter, switchMap, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import * as _ from 'lodash';

import { StatusModel } from '../models/status-model';
import { ConfigModel } from '../models/config-model';
import { PreferencesModel } from '../models/preferences-model';

import { ConfigService } from './config.service';
import { EMPTY_ARRAY } from '@angular/core/src/view';

declare var OWF: any;
declare var Ozone: any;

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  status: Observable<StatusModel> = null;
  preferences: Observable<PreferencesModel> = null;
  config: ConfigModel = null;

  constructor(private http: HttpClient,
    private configService: ConfigService) {
      this.config = this.configService.getConfig();
  }

  getPreference(namespace, name): Observable<PreferencesModel> {
    this.preferences = new Observable((observer) => {
      this.retrievePreference(observer, namespace, name);
    });

    return this.preferences;
  }

  private retrievePreference(observer, namespace, name) {
    OWF.Preferences.getUserPreference({
      namespace: namespace,
      name: name,
      onSuccess: this.onRetrievePreferenceSuccess.bind(this, observer),
      onFailure: this.onRetrievePreferenceFailure.bind(this, observer)
    });
  }

  private onRetrievePreferenceSuccess(observer, prefInfo) {
    let preference = new PreferencesModel(prefInfo.namespace, prefInfo.path, prefInfo.value);

    //console.log('UserCore Service (retrievePreference) completed: ', preference);
    observer.next(preference);
  }

  private onRetrievePreferenceFailure(observer, error, status) {
    let preference: PreferencesModel = null;

    //console.log('UserCore Service (retrievePreference) error: ', error, status);
    observer.next(preference);
  }

  setPreference(namespace, name, value): Observable<StatusModel> {
    this.status = new Observable((observer) => {
      this.storePreference(observer, namespace, name, value);
    });

    return this.status;
  }

  private storePreference(observer, namespace, name, value) {
    OWF.Preferences.setUserPreference({
      namespace: namespace,
      name: name,
      value: JSON.stringify(value),
      onSuccess: this.storePreferenceSuccess.bind(this, observer),
      onFailure: this.storePreferenceError.bind(this, observer)
    });
  }

  private storePreferenceSuccess(observer, prefValue) {
    let statusx = new StatusModel("200", "");

    //console.log('UserCore Service (storePreferenceSuccess) completed: ', prefValue);
    observer.next(statusx);
  }

  private storePreferenceError(observer, error, status) {
    let statusx = new StatusModel(error, status);

    //console.log('UserCore Service (storePreferenceError) error: ', error, status);
    observer.next(statusx);
  }
}