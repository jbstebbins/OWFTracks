(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["main"],{

/***/ "./src/$$_lazy_route_resource lazy recursive":
/*!**********************************************************!*\
  !*** ./src/$$_lazy_route_resource lazy namespace object ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./modules/track/track-core.module": [
		"./src/app/modules/track/track-core.module.ts"
	]
};
function webpackAsyncContext(req) {
	var ids = map[req];
	if(!ids) {
		return Promise.resolve().then(function() {
			var e = new Error("Cannot find module '" + req + "'");
			e.code = 'MODULE_NOT_FOUND';
			throw e;
		});
	}
	return Promise.all(ids.slice(1).map(__webpack_require__.e)).then(function() {
		var id = ids[0];
		return __webpack_require__(id);
	});
}
webpackAsyncContext.keys = function webpackAsyncContextKeys() {
	return Object.keys(map);
};
webpackAsyncContext.id = "./src/$$_lazy_route_resource lazy recursive";
module.exports = webpackAsyncContext;

/***/ }),

/***/ "./src/app/app.component.css":
/*!***********************************!*\
  !*** ./src/app/app.component.css ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2FwcC5jb21wb25lbnQuY3NzIn0= */"

/***/ }),

/***/ "./src/app/app.component.html":
/*!************************************!*\
  !*** ./src/app/app.component.html ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<app-menu></app-menu>\n<router-outlet></router-outlet>\n<router-outlet name=\"trackOutlet\"></router-outlet>\n<router-outlet name=\"errorOutlet\"></router-outlet>\n"

/***/ }),

/***/ "./src/app/app.component.ts":
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/*! exports provided: AppComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppComponent", function() { return AppComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _services_config_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./services/config.service */ "./src/app/services/config.service.ts");
/* harmony import */ var _services_action_notification_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./services/action-notification.service */ "./src/app/services/action-notification.service.ts");





var AppComponent = /** @class */ (function () {
    function AppComponent(router, notificationService, configService) {
        var _this = this;
        this.router = router;
        this.notificationService = notificationService;
        this.configService = configService;
        this.title = 'OWFWidget';
        this.menuOption = 'AppConfig';
        this.notificationService.subscriber$.subscribe(function (actionName) {
            console.log(actionName + ", received by AppComponent");
            // check the menu item pressed and take action
            if (actionName === "Connect REST") {
                _this.menuOption = 'ServiceRest';
                _this.router.navigate([{
                        outlets: {
                            primary: ['message', 'notice', { message: 'Displaying Status information!' }],
                            trackOutlet: ['service', 'connect.rest'],
                            errorOutlet: ['']
                        }
                    }]);
            }
            else {
                _this.router.navigate([{
                        outlets: {
                            primary: ['message', 'notice', { message: actionName + " received by AppComponent" }]
                        }
                    }]);
            }
        });
    }
    AppComponent.prototype.ngOnInit = function () {
        // this is required to initiate router for messaging
        this.router.navigate([{
                outlets: {
                    primary: ['message', 'notice', { message: 'Application Ready!!' }]
                }
            }]);
    };
    AppComponent.prototype.ngOnDestroy = function () {
    };
    AppComponent.prototype.notifyMenu = function () {
        this.notificationService.publisherAction('New File');
        console.log('New File, pressed from AppComponent');
    };
    AppComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: 'app-root',
            template: __webpack_require__(/*! ./app.component.html */ "./src/app/app.component.html"),
            styles: [__webpack_require__(/*! ./app.component.css */ "./src/app/app.component.css")]
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_angular_router__WEBPACK_IMPORTED_MODULE_2__["Router"],
            _services_action_notification_service__WEBPACK_IMPORTED_MODULE_4__["ActionNotificationService"],
            _services_config_service__WEBPACK_IMPORTED_MODULE_3__["ConfigService"]])
    ], AppComponent);
    return AppComponent;
}());



/***/ }),

/***/ "./src/app/app.module.ts":
/*!*******************************!*\
  !*** ./src/app/app.module.ts ***!
  \*******************************/
/*! exports provided: AppModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppModule", function() { return AppModule; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var _app_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./app.component */ "./src/app/app.component.ts");
/* harmony import */ var _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/platform-browser/animations */ "./node_modules/@angular/platform-browser/fesm5/animations.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
/* harmony import */ var ag_grid_angular__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ag-grid-angular */ "./node_modules/ag-grid-angular/main.js");
/* harmony import */ var ag_grid_angular__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(ag_grid_angular__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _modules_shared_services_shared_services_module__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./modules/shared-services/shared-services.module */ "./src/app/modules/shared-services/shared-services.module.ts");
/* harmony import */ var primeng_messages__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! primeng/messages */ "./node_modules/primeng/fesm5/primeng-messages.js");
/* harmony import */ var primeng_message__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! primeng/message */ "./node_modules/primeng/fesm5/primeng-message.js");
/* harmony import */ var primeng_toast__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! primeng/toast */ "./node_modules/primeng/fesm5/primeng-toast.js");
/* harmony import */ var primeng_button__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! primeng/button */ "./node_modules/primeng/fesm5/primeng-button.js");
/* harmony import */ var primeng_menubar__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! primeng/menubar */ "./node_modules/primeng/fesm5/primeng-menubar.js");
/* harmony import */ var _components_menu_menu_component__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./components/menu/menu.component */ "./src/app/components/menu/menu.component.ts");
/* harmony import */ var _components_growler_growler_component__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./components/growler/growler.component */ "./src/app/components/growler/growler.component.ts");
/* harmony import */ var _components_page_not_found_page_not_found_component__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./components/page-not-found/page-not-found.component */ "./src/app/components/page-not-found/page-not-found.component.ts");
/* harmony import */ var _modules_track_track_core_module__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./modules/track/track-core.module */ "./src/app/modules/track/track-core.module.ts");


















var routes = [
    { path: 'service', loadChildren: './modules/track/track-core.module#TrackCoreModule' },
    { path: '', redirectTo: '/', pathMatch: 'full' },
    { path: 'message/:type', component: _components_growler_growler_component__WEBPACK_IMPORTED_MODULE_15__["GrowlerComponent"] },
    { path: '**', component: _components_page_not_found_page_not_found_component__WEBPACK_IMPORTED_MODULE_16__["PageNotFoundComponent"], outlet: 'trackOutlet' },
    { path: '**', component: _components_page_not_found_page_not_found_component__WEBPACK_IMPORTED_MODULE_16__["PageNotFoundComponent"], outlet: 'errorOutlet' },
    { path: '**', redirectTo: 'message' }
];
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_2__["NgModule"])({
            declarations: [
                _app_component__WEBPACK_IMPORTED_MODULE_4__["AppComponent"],
                _components_menu_menu_component__WEBPACK_IMPORTED_MODULE_14__["MenuComponent"],
                _components_page_not_found_page_not_found_component__WEBPACK_IMPORTED_MODULE_16__["PageNotFoundComponent"],
                _components_growler_growler_component__WEBPACK_IMPORTED_MODULE_15__["GrowlerComponent"],
                _modules_shared_services_shared_services_module__WEBPACK_IMPORTED_MODULE_8__["SharedComponents"]
            ],
            imports: [
                _angular_router__WEBPACK_IMPORTED_MODULE_3__["RouterModule"].forRoot(routes, { /* enableTracing: true */}),
                _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"],
                _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_5__["BrowserAnimationsModule"],
                _angular_common_http__WEBPACK_IMPORTED_MODULE_6__["HttpClientModule"],
                primeng_messages__WEBPACK_IMPORTED_MODULE_9__["MessagesModule"],
                primeng_message__WEBPACK_IMPORTED_MODULE_10__["MessageModule"],
                primeng_toast__WEBPACK_IMPORTED_MODULE_11__["ToastModule"],
                primeng_menubar__WEBPACK_IMPORTED_MODULE_13__["MenubarModule"],
                primeng_button__WEBPACK_IMPORTED_MODULE_12__["ButtonModule"],
                _modules_track_track_core_module__WEBPACK_IMPORTED_MODULE_17__["TrackCoreModule"],
                ag_grid_angular__WEBPACK_IMPORTED_MODULE_7__["AgGridModule"].withComponents([]),
                _modules_shared_services_shared_services_module__WEBPACK_IMPORTED_MODULE_8__["SharedServicesModule"].forRoot()
            ],
            providers: [],
            bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_4__["AppComponent"]]
        })
    ], AppModule);
    return AppModule;
}());



/***/ }),

/***/ "./src/app/components/growler/growler.component.css":
/*!**********************************************************!*\
  !*** ./src/app/components/growler/growler.component.css ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ":host ::ng-deep button {\r\n    margin-right: .25em;\r\n  }\r\n  \r\n  :host ::ng-deep .ui-message,\r\n  :host ::ng-deep .ui-inputtext {\r\n    margin-right: .25em;\r\n  }\r\n\r\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvY29tcG9uZW50cy9ncm93bGVyL2dyb3dsZXIuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtJQUNJLG1CQUFtQjtFQUNyQjs7RUFFQTs7SUFFRSxtQkFBbUI7RUFDckIiLCJmaWxlIjoic3JjL2FwcC9jb21wb25lbnRzL2dyb3dsZXIvZ3Jvd2xlci5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiOmhvc3QgOjpuZy1kZWVwIGJ1dHRvbiB7XHJcbiAgICBtYXJnaW4tcmlnaHQ6IC4yNWVtO1xyXG4gIH1cclxuICBcclxuICA6aG9zdCA6Om5nLWRlZXAgLnVpLW1lc3NhZ2UsXHJcbiAgOmhvc3QgOjpuZy1kZWVwIC51aS1pbnB1dHRleHQge1xyXG4gICAgbWFyZ2luLXJpZ2h0OiAuMjVlbTtcclxuICB9XHJcbiJdfQ== */"

/***/ }),

/***/ "./src/app/components/growler/growler.component.html":
/*!***********************************************************!*\
  !*** ./src/app/components/growler/growler.component.html ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<p-toast [style]=\"{marginTop: '80px'}\"></p-toast>"

/***/ }),

/***/ "./src/app/components/growler/growler.component.ts":
/*!*********************************************************!*\
  !*** ./src/app/components/growler/growler.component.ts ***!
  \*********************************************************/
/*! exports provided: GrowlerComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GrowlerComponent", function() { return GrowlerComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var primeng_api__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! primeng/api */ "./node_modules/primeng/fesm5/primeng-api.js");




var GrowlerComponent = /** @class */ (function () {
    function GrowlerComponent(route, messageService) {
        this.route = route;
        this.messageService = messageService;
    }
    GrowlerComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.route.params.subscribe(function (params) {
            if (params.hasOwnProperty('type')) {
                _this.messageService.add({ severity: 'success', summary: 'info', detail: params['message'] });
            }
        });
    };
    GrowlerComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: 'app-growler',
            template: __webpack_require__(/*! ./growler.component.html */ "./src/app/components/growler/growler.component.html"),
            providers: [primeng_api__WEBPACK_IMPORTED_MODULE_3__["MessageService"]],
            styles: [__webpack_require__(/*! ./growler.component.css */ "./src/app/components/growler/growler.component.css")]
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_angular_router__WEBPACK_IMPORTED_MODULE_2__["ActivatedRoute"], primeng_api__WEBPACK_IMPORTED_MODULE_3__["MessageService"]])
    ], GrowlerComponent);
    return GrowlerComponent;
}());



/***/ }),

/***/ "./src/app/components/menu/menu.component.css":
/*!****************************************************!*\
  !*** ./src/app/components/menu/menu.component.css ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2NvbXBvbmVudHMvbWVudS9tZW51LmNvbXBvbmVudC5jc3MifQ== */"

/***/ }),

/***/ "./src/app/components/menu/menu.component.html":
/*!*****************************************************!*\
  !*** ./src/app/components/menu/menu.component.html ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<p-menubar [model]=\"menuItems.items\">\n  <div>\n    <input type=\"text\" #search placeholder=\"{{searchText}}\" (keyup.enter)=\"onSearchEnter(search.value)\">\n    <button pButton icon=\"fa fa-sign-out\" style=\"margin-left:.25em\" (click)=\"onSearchEnter(search.value)\"></button>\n  </div>\n</p-menubar>"

/***/ }),

/***/ "./src/app/components/menu/menu.component.ts":
/*!***************************************************!*\
  !*** ./src/app/components/menu/menu.component.ts ***!
  \***************************************************/
/*! exports provided: MenuComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MenuComponent", function() { return MenuComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _services_action_notification_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/action-notification.service */ "./src/app/services/action-notification.service.ts");
/* harmony import */ var _models_menu_model__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../models/menu-model */ "./src/app/models/menu-model.ts");




var MenuComponent = /** @class */ (function () {
    function MenuComponent(notificationService) {
        this.notificationService = notificationService;
        this.searchText = 'Search';
        this.subscription = notificationService.publisher$.subscribe(function (itemName) {
            console.log(itemName + ", received by MenuComponent");
        });
    }
    MenuComponent.prototype.ngOnInit = function () {
        this.menuItems = new _models_menu_model__WEBPACK_IMPORTED_MODULE_3__["MenuModel"]();
        // add commands to menu model
        var items = this.menuItems;
        items.items[0].items[0].command = this.notifyMenu.bind(this); // Service -> Load CSV
        items.items[0].items[1].command = this.notifyMenu.bind(this); // Service -> Load Rest
        items.items[0].items[2].command = this.notifyMenu.bind(this); // Service -> Load Rest
        items.items[1].items[0].command = this.notifyMenu.bind(this); // help -> about
    };
    MenuComponent.prototype.ngOnDestroy = function () {
        // prevent memory leak when component destroyed
        this.subscription.unsubscribe();
    };
    MenuComponent.prototype.notifyMenu = function (event) {
        this.notificationService.subscriberAction(event.item.label);
        this.searchText = event.item.label;
        console.log(event.item.label + ", pressed from MenuComponent ");
    };
    MenuComponent.prototype.onSearchEnter = function (value) {
        if (value === '') {
            this.searchText = 'Search';
        }
        else {
            this.searchText = value;
        }
        console.log("search value: " + value);
        this.notificationService.subscriberAction(value);
    };
    MenuComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: 'app-menu',
            template: __webpack_require__(/*! ./menu.component.html */ "./src/app/components/menu/menu.component.html"),
            styles: [__webpack_require__(/*! ./menu.component.css */ "./src/app/components/menu/menu.component.css")]
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_services_action_notification_service__WEBPACK_IMPORTED_MODULE_2__["ActionNotificationService"]])
    ], MenuComponent);
    return MenuComponent;
}());



/***/ }),

/***/ "./src/app/components/page-not-found/page-not-found.component.css":
/*!************************************************************************!*\
  !*** ./src/app/components/page-not-found/page-not-found.component.css ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2NvbXBvbmVudHMvcGFnZS1ub3QtZm91bmQvcGFnZS1ub3QtZm91bmQuY29tcG9uZW50LmNzcyJ9 */"

/***/ }),

/***/ "./src/app/components/page-not-found/page-not-found.component.html":
/*!*************************************************************************!*\
  !*** ./src/app/components/page-not-found/page-not-found.component.html ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<h1>{{description}}</h1>"

/***/ }),

/***/ "./src/app/components/page-not-found/page-not-found.component.ts":
/*!***********************************************************************!*\
  !*** ./src/app/components/page-not-found/page-not-found.component.ts ***!
  \***********************************************************************/
/*! exports provided: PageNotFoundComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PageNotFoundComponent", function() { return PageNotFoundComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");



var PageNotFoundComponent = /** @class */ (function () {
    function PageNotFoundComponent(route, router) {
        this.route = route;
        this.router = router;
        this.description = '';
    }
    PageNotFoundComponent.prototype.ngOnInit = function () {
    };
    PageNotFoundComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: 'app-page-not-found',
            template: __webpack_require__(/*! ./page-not-found.component.html */ "./src/app/components/page-not-found/page-not-found.component.html"),
            styles: [__webpack_require__(/*! ./page-not-found.component.css */ "./src/app/components/page-not-found/page-not-found.component.css")]
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_angular_router__WEBPACK_IMPORTED_MODULE_2__["ActivatedRoute"], _angular_router__WEBPACK_IMPORTED_MODULE_2__["Router"]])
    ], PageNotFoundComponent);
    return PageNotFoundComponent;
}());



/***/ }),

/***/ "./src/app/library/owf-api.ts":
/*!************************************!*\
  !*** ./src/app/library/owf-api.ts ***!
  \************************************/
/*! exports provided: OwfApi */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OwfApi", function() { return OwfApi; });
var OwfApi = /** @class */ (function () {
    function OwfApi() {
        this.subcribedChannels = [];
    }
    OwfApi.prototype.initialize = function () {
        var self = this;
        this._WidgetStateController = Ozone.state.WidgetState.getInstance({
            widgetEventingController: Ozone.eventing.Widget.getInstance(),
            autoInit: true,
            // this is fired on any event that you are registered for.
            // the msg object tells us what event it was
            onStateEventReceived: function (sender, msg) {
                if (msg.eventName === 'beforeclose') {
                    self.shutdownWidget(null, null);
                }
            }
        });
        this._WidgetStateController.addStateEventOverrides({
            events: ['beforeclose']
        });
    };
    OwfApi.prototype.shutdownWidget = function (sender, msg) {
        var self = this;
        // remove listener override to prevent looping
        this._WidgetStateController.removeStateEventOverrides({
            events: ['beforeclose'],
            callback: function () {
                console.log('.. widget shutdown!!');
                // unpublish active track layers
                // unsubcribe the events
                self.subcribedChannels.forEach(function (element) {
                    OWF.Eventing.unsubscribe(element);
                });
                self._WidgetStateController.closeWidget();
            }
        });
    };
    OwfApi.prototype.addChannelSubscription = function (channel, callback) {
        this.subcribedChannels.push(channel);
        OWF.Eventing.subscribe(channel, callback);
    };
    OwfApi.prototype.sendChannelRequest = function (channel, data) {
        OWF.Eventing.publish(channel, JSON.stringify(data));
    };
    OwfApi.prototype.requestMapViewStatus = function () {
        this.sendChannelRequest("map.status.request", { types: ["view"] });
    };
    return OwfApi;
}());



/***/ }),

/***/ "./src/app/models/map-view-model.ts":
/*!******************************************!*\
  !*** ./src/app/models/map-view-model.ts ***!
  \******************************************/
/*! exports provided: MapViewModel, Bounds, LatLon, TimeSpanTime, TimeSpan */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MapViewModel", function() { return MapViewModel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Bounds", function() { return Bounds; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LatLon", function() { return LatLon; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TimeSpanTime", function() { return TimeSpanTime; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TimeSpan", function() { return TimeSpan; });
var MapViewModel = /** @class */ (function () {
    function MapViewModel(bounds, center, range, scale, zoom, basemap, spatialReference, coordinateFormat, mapId, requestor, time) {
        this.bounds = bounds;
        this.center = center;
        this.range = range;
        this.scale = scale;
        this.zoom = zoom;
        this.basemap = basemap;
        this.spatialReference = spatialReference;
        this.coordinateFormat = coordinateFormat;
        this.mapId = mapId;
        this.requestor = requestor;
        this.time = time;
    }
    return MapViewModel;
}());

var Bounds = /** @class */ (function () {
    function Bounds(southWest, northEast) {
        this.southWest = southWest;
        this.northEast = northEast;
    }
    return Bounds;
}());

var LatLon = /** @class */ (function () {
    function LatLon(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }
    return LatLon;
}());

var TimeSpanTime = /** @class */ (function () {
    function TimeSpanTime(timeSpan, timeSpans, timeStamp) {
        this.timeSpan = timeSpan;
        this.timeSpans = timeSpans;
        this.timeStamp = timeStamp;
    }
    return TimeSpanTime;
}());

var TimeSpan = /** @class */ (function () {
    function TimeSpan(begin, end) {
        this.begin = begin;
        this.end = end;
    }
    return TimeSpan;
}());



/***/ }),

/***/ "./src/app/models/menu-model.ts":
/*!**************************************!*\
  !*** ./src/app/models/menu-model.ts ***!
  \**************************************/
/*! exports provided: MenuModel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MenuModel", function() { return MenuModel; });
var MenuModel = /** @class */ (function () {
    function MenuModel() {
        this.items = [{
                label: 'Service',
                icon: 'pi pi-fw pi-paperclip',
                items: [{
                        label: 'Connect CSV',
                        icon: 'pi pi-fw pi-info',
                        command: null
                    },
                    {
                        label: 'Connect REST',
                        icon: 'pi pi-fw pi-list',
                        command: null
                    },
                    {
                        label: 'Connect Stream',
                        icon: 'pi pi-fw pi-list',
                        command: null
                    }
                ]
            },
            {
                label: 'Help',
                icon: 'pi pi-fw pi-question',
                items: [{
                        label: 'About',
                        icon: 'pi pi-fw pi-info',
                        command: null
                    }
                ]
            }
        ];
    }
    return MenuModel;
}());



/***/ }),

/***/ "./src/app/models/preferences-model.ts":
/*!*********************************************!*\
  !*** ./src/app/models/preferences-model.ts ***!
  \*********************************************/
/*! exports provided: PreferencesModel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PreferencesModel", function() { return PreferencesModel; });
var PreferencesModel = /** @class */ (function () {
    function PreferencesModel(namespace, name, value) {
        this.namespace = namespace;
        this.name = name;
        this.value = value;
    }
    return PreferencesModel;
}());



/***/ }),

/***/ "./src/app/models/status-model.ts":
/*!****************************************!*\
  !*** ./src/app/models/status-model.ts ***!
  \****************************************/
/*! exports provided: StatusModel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StatusModel", function() { return StatusModel; });
var StatusModel = /** @class */ (function () {
    function StatusModel(error, status) {
        this.error = error;
        this.status = status;
    }
    return StatusModel;
}());



/***/ }),

/***/ "./src/app/modules/shared-services/shared-services.module.ts":
/*!*******************************************************************!*\
  !*** ./src/app/modules/shared-services/shared-services.module.ts ***!
  \*******************************************************************/
/*! exports provided: SharedServicesModule, SharedComponents */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SharedServicesModule", function() { return SharedServicesModule; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SharedComponents", function() { return SharedComponents; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _services_action_notification_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/action-notification.service */ "./src/app/services/action-notification.service.ts");
/* harmony import */ var _services_config_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../services/config.service */ "./src/app/services/config.service.ts");
/* harmony import */ var _services_preferences_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../services/preferences.service */ "./src/app/services/preferences.service.ts");
/* harmony import */ var _services_map_messages_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../services/map-messages.service */ "./src/app/services/map-messages.service.ts");






var SharedServicesModule = /** @class */ (function () {
    function SharedServicesModule() {
    }
    SharedServicesModule_1 = SharedServicesModule;
    SharedServicesModule.forRoot = function () {
        return {
            ngModule: SharedServicesModule_1,
            providers: [_services_action_notification_service__WEBPACK_IMPORTED_MODULE_2__["ActionNotificationService"], _services_config_service__WEBPACK_IMPORTED_MODULE_3__["ConfigService"], _services_preferences_service__WEBPACK_IMPORTED_MODULE_4__["PreferencesService"], _services_map_messages_service__WEBPACK_IMPORTED_MODULE_5__["MapMessagesService"]]
        };
    };
    var SharedServicesModule_1;
    SharedServicesModule = SharedServicesModule_1 = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"])({})
    ], SharedServicesModule);
    return SharedServicesModule;
}());

var SharedComponents = [];


/***/ }),

/***/ "./src/app/modules/track/cot-minotaur/cot-minotaur.component.css":
/*!***********************************************************************!*\
  !*** ./src/app/modules/track/cot-minotaur/cot-minotaur.component.css ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL21vZHVsZXMvdHJhY2svY290LW1pbm90YXVyL2NvdC1taW5vdGF1ci5jb21wb25lbnQuY3NzIn0= */"

/***/ }),

/***/ "./src/app/modules/track/cot-minotaur/cot-minotaur.component.html":
/*!************************************************************************!*\
  !*** ./src/app/modules/track/cot-minotaur/cot-minotaur.component.html ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<ag-grid-angular #agGridCot class=\"ag-theme-balham\" [rowData]=\"rowData\"\n    [columnDefs]=\"columnDefinitions\" [domLayout]=\"domLayout\"\n    (gridReady)=\"onGridReady($event)\" (firstDataRendered)=\"onFirstDataRendered($event)\">\n</ag-grid-angular>\n"

/***/ }),

/***/ "./src/app/modules/track/cot-minotaur/cot-minotaur.component.ts":
/*!**********************************************************************!*\
  !*** ./src/app/modules/track/cot-minotaur/cot-minotaur.component.ts ***!
  \**********************************************************************/
/*! exports provided: CotMinotaurComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CotMinotaurComponent", function() { return CotMinotaurComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
/* harmony import */ var ag_grid_angular__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ag-grid-angular */ "./node_modules/ag-grid-angular/main.js");
/* harmony import */ var ag_grid_angular__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(ag_grid_angular__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _services_config_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../services/config.service */ "./src/app/services/config.service.ts");
/* harmony import */ var _services_cot_minotaur_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../services/cot-minotaur.service */ "./src/app/services/cot-minotaur.service.ts");
/* harmony import */ var _services_map_messages_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../../services/map-messages.service */ "./src/app/services/map-messages.service.ts");








/* do not use providers in component for shared services */
var CotMinotaurComponent = /** @class */ (function () {
    function CotMinotaurComponent(configService, cotMinotaurSerice, mapMessageService) {
        this.configService = configService;
        this.cotMinotaurSerice = cotMinotaurSerice;
        this.mapMessageService = mapMessageService;
        this.config = null;
        this.mapStatusView = null;
        this.trackData = [];
        this.columnDefinitions = [];
        this.rowData = [];
        this.cacheRowData = [];
        this.domLayout = "autoHeight";
        this.gridOptions = {
            rowData: this.rowData,
            columnDefs: this.createColumnDefs(),
            context: {
                componentParent: this
            },
            pagination: true
        };
    }
    CotMinotaurComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.config = this.configService.getConfig();
        // do intial get on tracks
        this.cotMinotaurSerice.getCotTracks().subscribe(function (response) {
            _this.updateTrackData(response, true);
        });
        this.mapStatusView = this.mapMessageService.getMapView().subscribe(function (mapView) {
            console.log(mapView);
        });
        // start the refresh using timeout
        setTimeout(function () {
            Object(rxjs__WEBPACK_IMPORTED_MODULE_2__["interval"])(5000).pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["startWith"])(0), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["switchMap"])(function () { return _this.cotMinotaurSerice.getCotTracks(); })).subscribe(function (response) {
                console.log(response);
                _this.updateTrackData(response);
            });
        }, 5000);
    };
    CotMinotaurComponent.prototype.ngOnDestroy = function () {
        // prevent memory leak when component destroyed
        this.mapStatusView.unsubscribe();
    };
    CotMinotaurComponent.prototype.updateTrackData = function (response, initial) {
        var _this = this;
        console.log(response);
        if (initial) {
            this.trackData = [];
            response.features.forEach(function (value) {
                _this.cacheRowData.push(value.id);
                _this.trackData.push({
                    id: value.id,
                    featureType: value.geometry.type,
                    name: value.properties.name,
                    type: value.properties.type,
                    category: value.properties.category,
                    class: value.properties.class,
                    alertLevel: value.properties.alertLevel,
                    threat: value.properties.threat,
                    dimension: value.properties.dimension,
                    flag: value.properties.flag,
                    speed: value.properties.speed,
                    dtg: value.properties.dtg,
                    altitude: value.properties.altitude,
                    course: value.properties.course,
                    classification: value.properties.classification
                });
            });
            this.agGrid.api.setRowData(this.trackData);
            console.log(this.trackData);
        }
        else {
            var addRows_1 = [], updateRows_1 = [], deleteRows = [];
            response.features.forEach(function (value) {
                if (_this.cacheRowData.indexOf(value.id)) {
                    updateRows_1.push({
                        id: value.id,
                        featureType: value.geometry.type,
                        name: value.properties.name,
                        type: value.properties.type,
                        category: value.properties.category,
                        class: value.properties.class,
                        alertLevel: value.properties.alertLevel,
                        threat: value.properties.threat,
                        dimension: value.properties.dimension,
                        flag: value.properties.flag,
                        speed: value.properties.speed,
                        dtg: value.properties.dtg,
                        altitude: value.properties.altitude,
                        course: value.properties.course,
                        classification: value.properties.classification
                    });
                }
                else {
                    addRows_1.push({
                        id: value.id,
                        featureType: value.geometry.type,
                        name: value.properties.name,
                        type: value.properties.type,
                        category: value.properties.category,
                        class: value.properties.class,
                        alertLevel: value.properties.alertLevel,
                        threat: value.properties.threat,
                        dimension: value.properties.dimension,
                        flag: value.properties.flag,
                        speed: value.properties.speed,
                        dtg: value.properties.dtg,
                        altitude: value.properties.altitude,
                        course: value.properties.course,
                        classification: value.properties.classification
                    });
                }
            });
            console.log(addRows_1, updateRows_1, deleteRows);
            this.agGrid.api.updateRowData({ add: addRows_1, update: updateRows_1, remove: deleteRows });
        }
    };
    CotMinotaurComponent.prototype.createColumnDefs = function () {
        this.columnDefinitions = [
            { field: 'featureType', sortable: true },
            { field: 'name', sortable: true, filterable: true },
            { field: 'type', sortable: true, filterable: true },
            { field: 'category', sortable: true, filterable: true },
            { field: 'class', sortable: true, filterable: true },
            { field: 'alertLevel', sortable: true, filterable: true },
            { field: 'threat', sortable: true, filterable: true },
            { field: 'dimension', sortable: true },
            { field: 'flag', sortable: true, filterable: true },
            { field: 'speed', sortable: true },
            { field: 'dtg', sortable: true },
            { field: 'altitude', sortable: true },
            { field: 'course' },
            { field: 'classification', filterable: true }
        ];
        return this.columnDefinitions;
    };
    CotMinotaurComponent.prototype.onGridReady = function (event) {
        console.log(event);
        this.agGrid.gridOptions.getRowNodeId = function (data) {
            console.log(data.id);
            return data.id;
        };
    };
    CotMinotaurComponent.prototype.onFirstDataRendered = function (params) {
        console.log(params);
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ViewChild"])('agGridCot'),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:type", ag_grid_angular__WEBPACK_IMPORTED_MODULE_4__["AgGridAngular"])
    ], CotMinotaurComponent.prototype, "agGrid", void 0);
    CotMinotaurComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: 'app-cot-minotaur',
            template: __webpack_require__(/*! ./cot-minotaur.component.html */ "./src/app/modules/track/cot-minotaur/cot-minotaur.component.html"),
            styles: [__webpack_require__(/*! ./cot-minotaur.component.css */ "./src/app/modules/track/cot-minotaur/cot-minotaur.component.css")]
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_services_config_service__WEBPACK_IMPORTED_MODULE_5__["ConfigService"],
            _services_cot_minotaur_service__WEBPACK_IMPORTED_MODULE_6__["CotMinotaurService"],
            _services_map_messages_service__WEBPACK_IMPORTED_MODULE_7__["MapMessagesService"]])
    ], CotMinotaurComponent);
    return CotMinotaurComponent;
}());



/***/ }),

/***/ "./src/app/modules/track/track-core.module.ts":
/*!****************************************************!*\
  !*** ./src/app/modules/track/track-core.module.ts ***!
  \****************************************************/
/*! exports provided: TrackCoreModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TrackCoreModule", function() { return TrackCoreModule; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");
/* harmony import */ var primeng_fieldset__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! primeng/fieldset */ "./node_modules/primeng/fesm5/primeng-fieldset.js");
/* harmony import */ var primeng_tabview__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! primeng/tabview */ "./node_modules/primeng/fesm5/primeng-tabview.js");
/* harmony import */ var primeng_card__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! primeng/card */ "./node_modules/primeng/fesm5/primeng-card.js");
/* harmony import */ var primeng_panel__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! primeng/panel */ "./node_modules/primeng/fesm5/primeng-panel.js");
/* harmony import */ var ag_grid_angular__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ag-grid-angular */ "./node_modules/ag-grid-angular/main.js");
/* harmony import */ var ag_grid_angular__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(ag_grid_angular__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _shared_services_shared_services_module__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../shared-services/shared-services.module */ "./src/app/modules/shared-services/shared-services.module.ts");
/* harmony import */ var _track_core_track_core_component__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./track-core/track-core.component */ "./src/app/modules/track/track-core/track-core.component.ts");
/* harmony import */ var _cot_minotaur_cot_minotaur_component__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./cot-minotaur/cot-minotaur.component */ "./src/app/modules/track/cot-minotaur/cot-minotaur.component.ts");












var appRoutes = [
    {
        path: 'service', component: _track_core_track_core_component__WEBPACK_IMPORTED_MODULE_10__["TrackCoreComponent"], outlet: 'trackOutlet',
        children: [
            {
                path: 'connect.rest',
                component: _cot_minotaur_cot_minotaur_component__WEBPACK_IMPORTED_MODULE_11__["CotMinotaurComponent"]
            }
        ]
    }
];
var TrackCoreModule = /** @class */ (function () {
    function TrackCoreModule() {
    }
    TrackCoreModule = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"])({
            declarations: [_track_core_track_core_component__WEBPACK_IMPORTED_MODULE_10__["TrackCoreComponent"], _cot_minotaur_cot_minotaur_component__WEBPACK_IMPORTED_MODULE_11__["CotMinotaurComponent"]],
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_2__["CommonModule"],
                _angular_router__WEBPACK_IMPORTED_MODULE_3__["RouterModule"].forChild(appRoutes),
                primeng_fieldset__WEBPACK_IMPORTED_MODULE_4__["FieldsetModule"],
                primeng_tabview__WEBPACK_IMPORTED_MODULE_5__["TabViewModule"],
                primeng_card__WEBPACK_IMPORTED_MODULE_6__["CardModule"],
                primeng_panel__WEBPACK_IMPORTED_MODULE_7__["PanelModule"],
                ag_grid_angular__WEBPACK_IMPORTED_MODULE_8__["AgGridModule"].withComponents([]),
                _shared_services_shared_services_module__WEBPACK_IMPORTED_MODULE_9__["SharedServicesModule"].forRoot()
            ],
            exports: [_track_core_track_core_component__WEBPACK_IMPORTED_MODULE_10__["TrackCoreComponent"], _cot_minotaur_cot_minotaur_component__WEBPACK_IMPORTED_MODULE_11__["CotMinotaurComponent"]]
        })
    ], TrackCoreModule);
    return TrackCoreModule;
}());



/***/ }),

/***/ "./src/app/modules/track/track-core/track-core.component.css":
/*!*******************************************************************!*\
  !*** ./src/app/modules/track/track-core/track-core.component.css ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL21vZHVsZXMvdHJhY2svdHJhY2stY29yZS90cmFjay1jb3JlLmNvbXBvbmVudC5jc3MifQ== */"

/***/ }),

/***/ "./src/app/modules/track/track-core/track-core.component.html":
/*!********************************************************************!*\
  !*** ./src/app/modules/track/track-core/track-core.component.html ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<router-outlet></router-outlet>"

/***/ }),

/***/ "./src/app/modules/track/track-core/track-core.component.ts":
/*!******************************************************************!*\
  !*** ./src/app/modules/track/track-core/track-core.component.ts ***!
  \******************************************************************/
/*! exports provided: TrackCoreComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TrackCoreComponent", function() { return TrackCoreComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");


var TrackCoreComponent = /** @class */ (function () {
    function TrackCoreComponent() {
    }
    TrackCoreComponent.prototype.ngOnInit = function () {
    };
    TrackCoreComponent.prototype.ngOnDestroy = function () {
    };
    TrackCoreComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: 'app-track-core',
            template: __webpack_require__(/*! ./track-core.component.html */ "./src/app/modules/track/track-core/track-core.component.html"),
            styles: [__webpack_require__(/*! ./track-core.component.css */ "./src/app/modules/track/track-core/track-core.component.css")]
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [])
    ], TrackCoreComponent);
    return TrackCoreComponent;
}());



/***/ }),

/***/ "./src/app/services/action-notification.service.ts":
/*!*********************************************************!*\
  !*** ./src/app/services/action-notification.service.ts ***!
  \*********************************************************/
/*! exports provided: ActionNotificationService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ActionNotificationService", function() { return ActionNotificationService; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");



var ActionNotificationService = /** @class */ (function () {
    function ActionNotificationService() {
        // Observable string sources
        this.publisherSource = new rxjs__WEBPACK_IMPORTED_MODULE_2__["Subject"]();
        this.subscriberSource = new rxjs__WEBPACK_IMPORTED_MODULE_2__["Subject"]();
        // Observable string streams
        this.publisher$ = this.publisherSource.asObservable();
        this.subscriber$ = this.subscriberSource.asObservable();
    }
    // Service message commands
    ActionNotificationService.prototype.publisherAction = function (item) {
        this.publisherSource.next(item);
    };
    ActionNotificationService.prototype.subscriberAction = function (item) {
        this.subscriberSource.next(item);
    };
    ActionNotificationService = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"])({
            providedIn: 'root'
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [])
    ], ActionNotificationService);
    return ActionNotificationService;
}());



/***/ }),

/***/ "./src/app/services/config.service.ts":
/*!********************************************!*\
  !*** ./src/app/services/config.service.ts ***!
  \********************************************/
/*! exports provided: ConfigService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ConfigService", function() { return ConfigService; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");





var httpOptions = {
    headers: new _angular_common_http__WEBPACK_IMPORTED_MODULE_4__["HttpHeaders"]({ 'Content-Type': 'application/json' })
};
var ConfigService = /** @class */ (function () {
    function ConfigService(http) {
        this.http = http;
        this.config = null;
        this.configModel = null;
        this.baseUrl = 'assets/config.json';
        this.retrieveConfig();
    }
    ConfigService.prototype.retrieveConfig = function () {
        var _this = this;
        this.config = this.http
            .get(this.baseUrl, { responseType: 'json' })
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["catchError"])(this.handleError('retrieveConfig', [])), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["tap"])(console.log));
        this.config.subscribe(function (model) {
            _this.configModel = model;
        });
    };
    ConfigService.prototype.getConfig = function () {
        return this.configModel;
    };
    ConfigService.prototype.handleError = function (operation, result) {
        if (operation === void 0) { operation = 'operation'; }
        return function (error) {
            // TODO: send the error to remote logging infrastructure
            console.error(error); // log to console instead
            // Let the app keep running by returning an empty result.
            return Object(rxjs__WEBPACK_IMPORTED_MODULE_2__["of"])(result);
        };
    };
    ConfigService = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"])({
            providedIn: 'root',
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_angular_common_http__WEBPACK_IMPORTED_MODULE_4__["HttpClient"]])
    ], ConfigService);
    return ConfigService;
}());



/***/ }),

/***/ "./src/app/services/cot-minotaur.service.ts":
/*!**************************************************!*\
  !*** ./src/app/services/cot-minotaur.service.ts ***!
  \**************************************************/
/*! exports provided: CotMinotaurService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CotMinotaurService", function() { return CotMinotaurService; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs/operators */ "./node_modules/rxjs/_esm5/operators/index.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
/* harmony import */ var _config_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./config.service */ "./src/app/services/config.service.ts");
/* harmony import */ var _map_messages_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./map-messages.service */ "./src/app/services/map-messages.service.ts");







var CotMinotaurService = /** @class */ (function () {
    function CotMinotaurService(http, configService, mapMessageService) {
        this.http = http;
        this.configService = configService;
        this.mapMessageService = mapMessageService;
        //trackUrl: string = 'https://localhost:4200/assets/testdata/testfile.json';
        //trackUrl: string = 'https://localhost:8443/CotProviderSVC/rest/cotdummy/25';
        this.trackUrl = '';
        this.trackData = null;
        this.configReady = false;
        this.config = null;
        this.config = this.configService.getConfig();
        this.trackUrl = this.config.urls["CotService"];
    }
    CotMinotaurService.prototype.getCotTracks = function () {
        var _this = this;
        var httpOptions = {
            headers: new _angular_common_http__WEBPACK_IMPORTED_MODULE_4__["HttpHeaders"]({
                'Content-Type': 'application/json'
            }),
            observe: 'response',
            withCredentials: true
        };
        var tracks = this.http
            .get(this.trackUrl, httpOptions)
            .pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["tap"])(function (res) { _this.processResponse(res); }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["map"])(function (data) { return _this.trackData = data.body; }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_3__["catchError"])(this.handleError('getCotTracks', [])));
        return tracks;
    };
    CotMinotaurService.prototype.processResponse = function (response) {
        console.log(response.headers, response.status, response.type);
    };
    CotMinotaurService.prototype.handleError = function (operation, result) {
        if (operation === void 0) { operation = 'operation'; }
        return function (error) {
            // TODO: send the error to remote logging infrastructure
            console.error(error); // log to console instead
            // Let the app keep running by returning an empty result.
            return Object(rxjs__WEBPACK_IMPORTED_MODULE_2__["of"])(result);
        };
    };
    CotMinotaurService = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"])({
            providedIn: 'root'
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_angular_common_http__WEBPACK_IMPORTED_MODULE_4__["HttpClient"],
            _config_service__WEBPACK_IMPORTED_MODULE_5__["ConfigService"],
            _map_messages_service__WEBPACK_IMPORTED_MODULE_6__["MapMessagesService"]])
    ], CotMinotaurService);
    return CotMinotaurService;
}());



/***/ }),

/***/ "./src/app/services/map-messages.service.ts":
/*!**************************************************!*\
  !*** ./src/app/services/map-messages.service.ts ***!
  \**************************************************/
/*! exports provided: MapMessagesService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MapMessagesService", function() { return MapMessagesService; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
/* harmony import */ var _library_owf_api__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../library/owf-api */ "./src/app/library/owf-api.ts");
/* harmony import */ var _models_map_view_model__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../models/map-view-model */ "./src/app/models/map-view-model.ts");





var MapMessagesService = /** @class */ (function () {
    function MapMessagesService() {
        this.owfapi = new _library_owf_api__WEBPACK_IMPORTED_MODULE_3__["OwfApi"]();
        this.mapStatusView = null;
        this.subscribeChannels();
    }
    MapMessagesService.prototype.subscribeChannels = function () {
        var _this = this;
        this.mapStatusView = new rxjs__WEBPACK_IMPORTED_MODULE_2__["Observable"](function (observer) {
            _this.owfapi.addChannelSubscription('map.status.view', _this.receiveMapStatusView.bind(_this, observer));
            _this.owfapi.requestMapViewStatus();
        });
    };
    MapMessagesService.prototype.getMapView = function () {
        return this.mapStatusView;
    };
    MapMessagesService.prototype.receiveMapStatusView = function (observer, sender, msg, channel) {
        console.log(observer, sender, msg, channel);
        var message = JSON.parse(msg);
        var mBounds = new _models_map_view_model__WEBPACK_IMPORTED_MODULE_4__["Bounds"](message.bounds.southWest, message.bounds.northEast);
        var mCenter = new _models_map_view_model__WEBPACK_IMPORTED_MODULE_4__["LatLon"](message.center.lat, message.center.lon);
        var mTime = null;
        if (message.timeExtent) {
            var mTimeSpan = new _models_map_view_model__WEBPACK_IMPORTED_MODULE_4__["TimeSpan"](message.timeExtent.begin, message.timeExtent.end);
            var mTimeSpans_1 = null;
            if (message.timeExtent.timeSpans) {
                mTimeSpans_1 = [];
                message.timeExtent.timeSpans.array.forEach(function (element) {
                    var ts = new _models_map_view_model__WEBPACK_IMPORTED_MODULE_4__["TimeSpan"](element.begin, element.end);
                    mTimeSpans_1.push(ts);
                });
            }
            mTime = new _models_map_view_model__WEBPACK_IMPORTED_MODULE_4__["TimeSpanTime"](mTimeSpan, mTimeSpans_1, message.timeExtent.timeStamp);
        }
        var mapStatusView = new _models_map_view_model__WEBPACK_IMPORTED_MODULE_4__["MapViewModel"](mBounds, mCenter, message.range, message.scale, message.zoom, message.basemap, message.spatialReference.wkid, message.coordinateFormat, message.mapId, message.requester, mTime);
        observer.next(mapStatusView);
    };
    MapMessagesService = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"])({
            providedIn: 'root'
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [])
    ], MapMessagesService);
    return MapMessagesService;
}());



/***/ }),

/***/ "./src/app/services/preferences.service.ts":
/*!*************************************************!*\
  !*** ./src/app/services/preferences.service.ts ***!
  \*************************************************/
/*! exports provided: PreferencesService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PreferencesService", function() { return PreferencesService; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
/* harmony import */ var _models_status_model__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../models/status-model */ "./src/app/models/status-model.ts");
/* harmony import */ var _models_preferences_model__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../models/preferences-model */ "./src/app/models/preferences-model.ts");
/* harmony import */ var _config_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./config.service */ "./src/app/services/config.service.ts");







var PreferencesService = /** @class */ (function () {
    function PreferencesService(http, configService) {
        this.http = http;
        this.configService = configService;
        this.status = null;
        this.preferences = null;
        this.config = null;
        this.config = this.configService.getConfig();
    }
    PreferencesService.prototype.getPreference = function (namespace, name) {
        var _this = this;
        this.preferences = new rxjs__WEBPACK_IMPORTED_MODULE_2__["Observable"](function (observer) {
            _this.retrievePreference(observer, namespace, name);
        });
        return this.preferences;
    };
    PreferencesService.prototype.retrievePreference = function (observer, namespace, name) {
        OWF.Preferences.getUserPreference({
            namespace: namespace,
            name: name,
            onSuccess: this.onRetrievePreferenceSuccess.bind(this, observer),
            onFailure: this.onRetrievePreferenceFailure.bind(this, observer)
        });
    };
    PreferencesService.prototype.onRetrievePreferenceSuccess = function (observer, prefInfo) {
        var preference = new _models_preferences_model__WEBPACK_IMPORTED_MODULE_5__["PreferencesModel"](prefInfo.namespace, prefInfo.name, prefInfo.value);
        console.log('UserCore Service (retrievePreference) completed: ', preference);
        observer.next(preference);
    };
    PreferencesService.prototype.onRetrievePreferenceFailure = function (observer, error, status) {
        var preference = null;
        console.log('UserCore Service (retrievePreference) error: ', error, status);
        observer.next(preference);
    };
    PreferencesService.prototype.setPreference = function (namespace, name, value) {
        var _this = this;
        this.status = new rxjs__WEBPACK_IMPORTED_MODULE_2__["Observable"](function (observer) {
            _this.storePreference(observer, namespace, name, value);
        });
        return this.status;
    };
    PreferencesService.prototype.storePreference = function (observer, namespace, name, value) {
        OWF.Preferences.setUserPreference({
            namespace: namespace,
            name: name,
            value: JSON.stringify(value),
            onSuccess: this.storePreferenceSuccess.bind(this, observer),
            onFailure: this.storePreferenceError.bind(this, observer)
        });
    };
    PreferencesService.prototype.storePreferenceSuccess = function (observer, prefValue) {
        var statusx = new _models_status_model__WEBPACK_IMPORTED_MODULE_4__["StatusModel"]("200", "");
        console.log('UserCore Service (storePreferenceSuccess) completed: ', prefValue);
        observer.next(statusx);
    };
    PreferencesService.prototype.storePreferenceError = function (observer, error, status) {
        var statusx = new _models_status_model__WEBPACK_IMPORTED_MODULE_4__["StatusModel"](error, status);
        console.log('UserCore Service (storePreferenceError) error: ', error, status);
        observer.next(statusx);
    };
    PreferencesService = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"])({
            providedIn: 'root'
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_angular_common_http__WEBPACK_IMPORTED_MODULE_3__["HttpClient"],
            _config_service__WEBPACK_IMPORTED_MODULE_6__["ConfigService"]])
    ], PreferencesService);
    return PreferencesService;
}());



/***/ }),

/***/ "./src/environments/environment.ts":
/*!*****************************************!*\
  !*** ./src/environments/environment.ts ***!
  \*****************************************/
/*! exports provided: environment */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "environment", function() { return environment; });
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
var environment = {
    production: false
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
/* harmony import */ var _app_app_module__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./app/app.module */ "./src/app/app.module.ts");
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./environments/environment */ "./src/environments/environment.ts");
/* harmony import */ var jquery__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");
/* harmony import */ var jquery__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(jquery__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _app_library_owf_api__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./app/library/owf-api */ "./src/app/library/owf-api.ts");






if (_environments_environment__WEBPACK_IMPORTED_MODULE_3__["environment"].production) {
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["enableProdMode"])();
}
// add document/OWF ready check state
jquery__WEBPACK_IMPORTED_MODULE_4__(document).ready(function () {
    OWF.ready(function () {
        var owfapi = new _app_library_owf_api__WEBPACK_IMPORTED_MODULE_5__["OwfApi"]();
        owfapi.initialize();
        Object(_angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_1__["platformBrowserDynamic"])().bootstrapModule(_app_app_module__WEBPACK_IMPORTED_MODULE_2__["AppModule"])
            .catch(function (err) { return console.error(err); });
    });
});


/***/ }),

/***/ 0:
/*!***************************!*\
  !*** multi ./src/main.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! E:\development\angular\OWFTracks\src\main.ts */"./src/main.ts");


/***/ })

},[[0,"runtime","vendor"]]]);
//# sourceMappingURL=main.js.map