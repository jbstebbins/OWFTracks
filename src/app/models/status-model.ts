export class StatusModel {
	error: string;
	status: string;
	constructor(error: string, status: string) {
		this.error = error;
		this.status = status;
	}
}