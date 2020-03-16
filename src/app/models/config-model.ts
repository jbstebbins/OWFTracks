export class ConfigModel {
	version: string;
	buildDate: string;
	Urls: Urls[] | null;
	tokenServices: TokenServices[] | null;
	roles: string[] | null;

	constructor(version: string, buildDate: string, Urls: Urls[], tokenServices: TokenServices[], roles: string[]) {
		this.version = version;
		this.buildDate = buildDate;
		this.Urls = Urls;
		this.tokenServices = tokenServices;
		this.roles = roles;
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