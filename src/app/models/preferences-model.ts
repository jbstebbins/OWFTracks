export class PreferencesModel {
	namespace: string;
	name: string;
	value: string;

	constructor(namespace: string, name: string, value: string) {
		this.namespace = namespace;
		this.name = name;
		this.value = value;
	}
}