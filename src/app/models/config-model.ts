export class ConfigModel {
	version: string;
	buildDate: string;
	Urls: Urls[] | null;
	roles: string[] | null;

	constructor(version: string, buildDate: string, Urls: Urls[], roles: string[]) {
		this.version = version;
		this.buildDate = buildDate;
		this.Urls = Urls;
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