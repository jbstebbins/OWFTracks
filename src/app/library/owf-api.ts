declare var OWF: any;
declare var Ozone: any;

export class OwfApi {
	private _WidgetStateController: any;
	private _widgetEventingController: any;
	subcribedChannels: string[] = [];

	constructor() { }

	public initialize(callback: Function): void {
		this._widgetEventingController = Ozone.eventing.Widget.getInstance();
		this._WidgetStateController = Ozone.state.WidgetState.getInstance({
			widgetEventingController: this._widgetEventingController,
			// this is fired on any event that you are registered for.
			// the msg object tells us what event it was
			onStateEventReceived: function (sender: String, msg) {
				if ((msg.eventName === 'beforeclose') || (msg.eventName === 'beforedestroy')) {
					this._WidgetStateController.removeStateEventOverrides({
						event: [event],
						callback: function () {
							callback({channels: this.subcribedChannels});
							Ozone.state.WidgetState().closeWidget();
						}.bind(this)
					});
				}
			}.bind(this)
		});

		this._WidgetStateController.addStateEventOverrides({
			events: ['beforeclose', 'beforedestroy']
		});
	}

	public shutdownWidget(payload): void {
		// unsubcribe the events
		payload.channels.forEach(element => {
			OWF.Eventing.unsubscribe(element);
		});
	}

	public addChannelSubscription(channel: string, callback: any): void {
		this.subcribedChannels.push(channel);
		OWF.Eventing.subscribe(channel, callback);
	}

	public sendChannelRequest(channel: string, data?: any): void {
		OWF.Eventing.publish(channel, JSON.stringify(data));
	}

	public requestMapViewStatus(): void {
		this.sendChannelRequest("map.status.request", { types: ["view"] });
	}
}
