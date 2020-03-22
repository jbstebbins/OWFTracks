export class ConfigModel {
	version: string;
	buildDate: string;
	stateVersion: string;
	mapInterface: MapInterface;
	directories: any[] | null;
	layerParam: any;
	Urls: Urls[] | null;
	tokenServices: TokenServices[] | null;
	roles: string[] | null;

	constructor(version: string, buildDate: string, stateVersion: string, 
		mapInterface: MapInterface, directories: any[], 
		layerParam: any, Urls: Urls[], 
		tokenServices: TokenServices[], roles: string[]) {
		this.version = version;
		this.buildDate = buildDate;
		this.stateVersion = stateVersion;
		this.mapInterface = mapInterface;
		this.directories = directories;

		this.layerParam = layerParam;
		
		this.Urls = Urls;
		this.tokenServices = tokenServices;
		this.roles = roles;
	}
}

export class MapInterface {
	onPlot: boolean = false;
	onViewChange: boolean = false;

	constructor(onPlot: boolean, onViewChange: boolean) {
		this.onPlot = onPlot;
		this.onViewChange = onViewChange;
	}
}

export class Urls {
	service: string;
	url: string;

	constructor(service: string, url: string) {
		this.service = service;
		this.url = url;
	}
}

export class TokenServices {
	url: string;
	serviceUrl: string;
	token: string;

	constructor(url: string, serviceUrl: string, token: string) {
		this.url = url;
		this.serviceUrl = serviceUrl;
		this.token = token;
	}

}