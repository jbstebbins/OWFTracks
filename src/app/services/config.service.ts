import { Injectable } from '@angular/core';
import { Observable, of, EMPTY, forkJoin } from 'rxjs';
import { catchError, map, filter, switchMap, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import * as _ from 'lodash';

import { ConfigModel } from '../models/config-model';

const httpOptions = {
	headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
	providedIn: 'root',
})
export class ConfigService {
	configObservable: Observable<ConfigModel> = null;
	configModel: ConfigModel = null;
	private baseUrl = 'assets/config.json';
	private baseHref = '';

	memoryPersistence = {};

	constructor(private http: HttpClient) {
		this.retrieveConfig();
	}

	private retrieveConfig(): void {
		this.configObservable = this.http
			.get<ConfigModel>(this.baseUrl, { responseType: 'json', withCredentials: true })
			.pipe(
				catchError(this.handleError('retrieveConfig', [])),
				tap(console.log));

		this.configObservable.subscribe(model => {
			this.configModel = model;

			// if there are urls in token referer we need to retrieve and store them
			let responseList = [];
			let responseCalls: Observable<any>[] = [];
			this.configModel.tokenServices.forEach((item) => {
				if ((item.url !== undefined) && (item.url !== null)) {
					responseList.push(item.url);
					responseCalls.push(this.http.get<any>(item.url, { responseType: 'json', withCredentials: true })
						.pipe(
							catchError(this.handleError('retrieveConfig', [])),
							tap(console.log)));
				}
			});

			// make sure all are done and then return the results
			let servicesObservable:Observable<any[]> = forkJoin(responseCalls);
			let serviceSubscription = servicesObservable.subscribe((serviceArray) => {
				serviceSubscription.unsubscribe();

				// store the referer and remove the urls
				let found = false;				
				serviceArray.forEach((service) => {
					if ((service.serviceUrl !== undefined) && (service.refserviceUrlerer !== null)) {
						this.configModel.tokenServices.forEach((value) => {
							if (value.serviceUrl === service.serviceUrl) {
								value.token = service.token;
								found = true;
							}
						});

						if (!found) {
							this.configModel.tokenServices.push({
								"url": "",
								"serviceUrl": service.serviceUrl,
								"token": service.token
							});
						}
					}
				});
			});
		});
	}

	getConfig() {
		return this.configModel;
	}

	getBaseHref() {
		return this.configModel.Urls["baseUrl"] + "-" + this.configModel.version;
	}

	getMemoryValue(key) {
		return this.memoryPersistence[key];
	}

	removeMemoryValue(key) {
		delete this.memoryPersistence[key];
	}

	setMemoryValue(key, value) {
		this.memoryPersistence[key] = value;
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