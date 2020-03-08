import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { ConfigModel } from './models/config-model';
import { ConfigService } from './services/config.service';
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
		private configService: ConfigService) {
		this.notificationService.subscriber$.subscribe(
			payload => {
				console.log(`${payload.action}, received by AppComponent`);

				// check the menu item pressed and take action
				if (payload.action === "Connect CSV") {
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
	}

	ngOnInit() {
		// this is required to initiate router for messaging
		this.router.navigate([{
			outlets: {
				primary: ['message', 'Info', { title: 'Startup', message: 'Application Ready!!' }]
			}
		}]);
	}

	ngOnDestroy() {
	}
  
	notifyMenu() {
		this.notificationService.publisherAction({action:'New File'});
		console.log('New File, pressed from AppComponent');
	}
}
