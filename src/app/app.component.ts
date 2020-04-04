import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { ConfigModel } from './models/config-model';
import { ConfigService } from './services/config.service';
import { OwfContainerService } from './services/owf-container.service';
import { UserCoreService } from './services/owf-core.service';
import { ActionNotificationService } from './services/action-notification.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
	title = 'OWFWidget';

	menuOption: string = 'AppConfig';

	constructor(private router: Router,
		private notificationService: ActionNotificationService,
		private configService: ConfigService,
		private owfContainerService: OwfContainerService,
		private owfCoreService: UserCoreService) {
		this.notificationService.publisher$.subscribe(
			payload => {
				console.log(`${payload.action}, received by AppComponent`);

				// check the menu item pressed and take action
				if ((payload.action === 'USERINFO READY - USER') || (payload.action === 'USERINFO READY - UUID') ||
					(payload.action === 'USERINFO READY - SUMMARY')) {
					console.log(payload.action, this.owfContainerService.getContainer());
					console.log(payload.action, this.owfCoreService.getUser());
					console.log(payload.action, this.owfCoreService.getUserUUID());
					console.log(payload.action, this.owfCoreService.getUserSummary());
					//console.log(owfCoreService.getUserGroups());
				} else if (payload.action === "Connect CSV") {
					this.menuOption = 'ServiceCSV';

					this.router.navigate([{
						outlets: {
							primary: ['message', 'Success', { title: 'Navigation', message: 'Connected to CSV Module!' }],
							trackOutlet: ['service', 'connect.csv'],
							errorOutlet: ['']
						}
					}]);
				} else if (payload.action === "Connect REST") {
					this.menuOption = 'ServiceRest';

					this.router.navigate([{
						outlets: {
							primary: ['message', 'Success', { title: 'Navigation', message: 'Connected to Minotaur Module!' }],
							trackOutlet: ['service', 'connect.rest'],
							errorOutlet: ['']
						}
					}]);
				} else if (payload.action === "Connect FEATURE") {
					this.menuOption = 'ServiceFeature';

					this.router.navigate([{
						outlets: {
							primary: ['message', 'Success', { title: 'Navigation', message: 'Connected to Layer Module!' }],
							trackOutlet: ['service', 'connect.feature'],
							errorOutlet: ['']
						}
					}]);
				} else {
					this.router.navigate([{
						outlets: {
							primary: ['message', 'Info', { title: 'Navigation', message: `${payload.action} received by AppComponent` }]
						}
					}]);
				}
			}
		);

		// this is required to initiate router for messaging
		this.router.navigate([{
			outlets: {
				primary: ['message', 'Info', { title: 'Startup', message: 'Application Ready!!' }]
			}
		}]);
	}

	ngOnInit() {
		//console.log("app initialized.");
	}

	ngOnDestroy() {
		//console.log("app destroyed.");
	}

	notifyMenu() {
		this.notificationService.publisherAction({ action: 'New File' });
		//console.log('New File, pressed from AppComponent');
	}
}
