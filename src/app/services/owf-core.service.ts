import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError, forkJoin } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap, retry, retryWhen, delay, take } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import * as _ from 'lodash';

import { ActionNotificationService } from '../services/action-notification.service';
import { ConfigModel } from '../models/config-model';
import { OwfContainerModel } from '../models/owf-container-model';
import {
  UserModel, UserSummaryModel, UserGroupModel, UserDashboardAttribute, UserDashboardStack,
  UserDashboardModel, UserWidgetModel, UserWidgetAttribute, WidgetType, WidgetGroups
} from '../models/user-model';

import { ConfigService } from './config.service';
import { OwfContainerService } from './owf-container.service';
import { NullTemplateVisitor } from '@angular/compiler';
import { dashCaseToCamelCase } from '@angular/animations/browser/src/util';
import { EMPTY_ARRAY } from '@angular/core/src/view';

declare var OWF: any;
declare var Ozone: any;

@Injectable({
  providedIn: 'root'
})
export class UserCoreService {
  subscription: Subscription;

  userObservable: Observable<UserModel> = null;
  user: UserModel = null;
  uuidObservable: Observable<string> = null;
  uuid: string = "";

  summaryObservable: Observable<UserSummaryModel[]> = null;
  summary: UserSummaryModel[] = null;
  groupsObservable: Observable<UserGroupModel[]> = null;
  groups: UserGroupModel[] = null;
  dashboardsObservable: Observable<UserDashboardModel> = null;
  dashboards: UserDashboardModel = null;
  widgetsObservable: Observable<UserWidgetModel[]> = null;
  widgets: UserWidgetModel[] = null;

  owfUrl: string = 'https://localhost:8443/owf';

  constructor(private _zone: NgZone, private http: HttpClient,
    private configService: ConfigService,
    private owfContainerService: OwfContainerService,
    private notificationService: ActionNotificationService) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        //console.log(`${payload.action}, received by csv-core.component`);

        if (payload.action === "CONFIG READY") {
          this.owfUrl = configService.configModel.Urls["owfServer"];

          // get all user info needed
          window.setTimeout(() => {
            this.retrieveUserInfo();
            this.retrieveUserUUID();
          }, 10);
        }
      });
  }

  getUser(): UserModel {
    return this.user;
  }

  retrieveUserInfo() {
    if (this.user === null) {
      this.userObservable = new Observable((observer) => {
        Ozone.pref.PrefServer.getCurrentUser({
          onSuccess: this.retrieveOwfUserSuccess.bind(this, observer),
          onFailure: this.retrieveOwfUserError.bind(this, observer)
        });
      });

      this.userObservable.subscribe(userModel => {
        this.user = userModel;
        this.notificationService.publisherAction({ action: 'USERINFO READY - USER', value: this.user });

        this.retrieveUserSummary();
        this.retrieveUserGroups();
      });
    }
  }

  private retrieveOwfUserSuccess(observer, userInfo) {
    let user = new UserModel(userInfo.currentUserName, userInfo.currentUser,
      userInfo.currentUserPrevLogin, userInfo.currentId, userInfo.email);

    console.log('UserCore Service (retrieveOwfUserSuccess) completed: ', user);
    observer.next(user);
  }

  private retrieveOwfUserError(observer, error, status) {
    let user: UserModel = null;
    console.log('UserCoreService, retrieveOwfUserError()', error, status);
    observer.next(user);
  }

  getUserUUID(): string {
    return this.uuid;
  }

  retrieveUserUUID() {
    if (this.uuid === "") {
      this.uuidObservable = new Observable((observer) => {
        OWF.Preferences.getUserPreference({
          namespace: 'widget.base.user',
          name: 'uuid',
          onSuccess: this.retrieveUserUUIDSuccess.bind(this, observer),
          onFailure: this.retrieveUserUUIDError.bind(this, observer)
        });
      });

      this.uuidObservable.subscribe(uuid => {
        this.uuid = uuid;
        this.notificationService.publisherAction({ action: 'USERINFO READY - UUID', value: this.uuid });
      });
    }
  }

  private retrieveUserUUIDSuccess(observer, prefValue) {
    let uuid = JSON.parse(prefValue.value);

    console.log('UserCore Service (retrieveUserUUIDSuccess) completed: ', uuid);
    observer.next(uuid);
  }

  private retrieveUserUUIDError(observer, error, status) {
    console.log('UserCoreService, retrieveUserUUIDError()', error, status);

    if (status !== 404) {
      let uuid = OWF.Util.guid();
      observer.next(uuid);

      this.setUserUUID(uuid);
    }
  }

  private setUserUUID(uuid: string) {
    OWF.Preferences.setUserPreference({
      namespace: 'widget.base.user',
      name: 'uuid',
      value: JSON.stringify(uuid),
      onSuccess: this.setUserUUIDSuccess.bind(this),
      onFailure: this.setUserUUIDError.bind(this)
    });
  }

  private setUserUUIDSuccess(prefValue) {
    console.log('UserCore Service (setUserUUIDSuccess) completed: ', prefValue);
  }

  private setUserUUIDError(error, status) {
    console.log('UserCoreService, setUserUUIDError()', error, status);
  }

  getUserSummary() {
    return this.summary;
  }

  retrieveUserSummary() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('testAdmin1:password')
      })
    };

    this.summaryObservable = this.http
      .get<UserSummaryModel[]>(this.owfUrl + '/user/' + this.user.id, httpOptions)
      .pipe(
        catchError(this.handleError('getUserSummary', [])),
        tap(console.log));

    this.summaryObservable.subscribe(summary => {
      this.summary = summary;
      this.notificationService.publisherAction({ action: 'USERINFO READY - SUMMARY', value: this.summary });
    });
  }

  getUserGroups() {
    return this.groups;
  }

  retrieveUserGroups() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('testAdmin1:password')
      })
    };

    this.groupsObservable = this.http
      .get<UserGroupModel[]>(this.owfUrl + '/group?user_id=' + this.user.id, httpOptions)
      .pipe(
        catchError(this.handleError('getUserGroups', [])),
        tap(console.log));

    this.groupsObservable.subscribe(groups => {
      this.groups = groups;
      this.notificationService.publisherAction({ action: 'USERINFO READY - GROUPS', value: this.groups });
    });
  }
  /*
  retrieveDashboard(userId: string): Observable<UserDashboardModel> {
    if (this.dashboards === null) {
      this.dashboards = new Observable((observer) => {
        this.retrieveOwfUserDashboardInfo(userId, observer);
      });
    }

    return this.dashboards;
  }

  private retrieveOwfUserDashboardInfo(userId: string, observer) {
    let searchConfig = {
      user_id: userId,
      onSuccess: this.retrieveOwfUserDashboardSuccess.bind(this, observer),
      onFailure: this.retrieveOwfUserDashboardError.bind(this, observer)
    };
    OWF.Preferences.findDashboards(searchConfig);
  }

  private retrieveOwfUserDashboardSuccess(observer, dashboardInfo) {
    let dashboards: UserDashboardModel = null;

    dashboardInfo.data.forEach(function (value) {
      let dashboard = new UserDashboardAttribute(value.createdDate, value.editedDate, value.description, value.guid,
        value.name, value.user.userId, value.isGroupDashboard, value.isDefault,
        value.locked, value.poblishedToStore, value.dashboardPosition, value.iconImageUrl,
        new UserDashboardStack(value.stack.approved, value.stack.id, value.stack.name,
          (value.stack.owner ? value.stack.owner.name : null), (value.stack.owner ? value.stack.owner.id : null), value.stack.imageUrl));

      if (dashboards === null) {
        dashboards = new UserDashboardModel(dashboardInfo.results, dashboardInfo.success, [dashboard]);
      } else {
        dashboards.attributes.push(dashboard);
      }
    });

    console.log('UserCore Service (retrieveOwfUserDashboardSuccess) completed: ', dashboards);
    observer.next(dashboards);
  }

  private retrieveOwfUserDashboardError(observer, error, status) {
    let dashboards: UserDashboardModel = null;

    console.log('UserCoreService, retrieveOwfUserDashboardError()', error, status);
    observer.next(dashboards);
  }

  retrieveWidgets(): Observable<UserWidgetModel[]> {
    if (this.widgets === null) {
      this.widgets = new Observable((observer) => {
        this.retrieveOwfUserWidgetsInfo(observer);
      });
    }

    return this.widgets;
  }

  private retrieveOwfUserWidgetsInfo(observer) {
    let searchConfig = {
      userOnly: true,
      onSuccess: this.retrieveOwfUserWidgetsSuccess.bind(this, observer),
      onFailure: this.retrieveOwfUserWidgetsError.bind(this, observer)
    };
    OWF.Preferences.findWidgets(searchConfig);
  }

  private retrieveOwfUserWidgetsSuccess(observer, widgetInfo) {
    let widgets: UserWidgetModel[] = [];
    let widgetTypes: WidgetType[] = [];
    let widgetGroups: WidgetGroups[] = [];

    widgetInfo.forEach(function (item) {
      widgetTypes = [];
      widgetGroups = [];

      item.value.widgetTypes.forEach(function (type) {
        widgetTypes.push(new WidgetType(type.displayName, type.id, type.name));
      });

      item.value.groups.forEach(function (group) {
        widgetGroups.push(new WidgetGroups(group.stackDefault, group.totalStacks, group.status, group.totalUsers,
          group.id, group.description, group.totalWidgets, group.email, group.name, group.automatic,
          group.displayName));
      });

      let widgetAttribute = new UserWidgetAttribute(item.value.background, item.value.disabled, item.value.favorite, item.value.mobileReady,
        item.value.singleton, item.value.visible, item.value.description, item.value.originalName, item.value.namespace, item.value.universalName,
        item.value.userId, item.value.userRealName, item.value.height, item.value.width, item.value.maximized, item.value.minimized,
        item.value.position, item.value.widgetVersion, item.value.headerIconUrl, item.value.imageUrl, item.value.largeIconUrl,
        item.value.smallIconUrl, item.value.url, null, widgetTypes, widgetGroups);

      let widgetModel = new UserWidgetModel(item.id, item.namespace, item.path, widgetAttribute);

      widgets.push(widgetModel);
    });

    console.log('UserCore Service (retrieveOwfUserWidgetsSuccess) completed: ', widgets);
    observer.next(widgets);
  }

  private retrieveOwfUserWidgetsError(observer, error, status) {
    let widgets: UserWidgetModel[] = null;

    console.log('UserCoreService, retrieveOwfUserWidgetsError()', error, status);
    observer.next(widgets);
  }
  */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
