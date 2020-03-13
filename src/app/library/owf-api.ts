declare var OWF: any;
declare var Ozone: any;

export class OwfApi {
	private _WidgetStateController: any;
	subcribedChannels: string[] = [];

	constructor() { }

	public initialize(): void {
		let self = this;

		this._WidgetStateController = Ozone.state.WidgetState.getInstance({
			widgetEventingController: Ozone.eventing.Widget.getInstance(),
			autoInit: true,

			// this is fired on any event that you are registered for.
			// the msg object tells us what event it was
			onStateEventReceived: function (sender: String, msg) {
				if (msg.eventName === 'beforeclose') {
					self.shutdownWidget(null, null);
				}
			}
		});
		
		this._WidgetStateController.addStateEventOverrides({
			events: ['beforeclose']
		});
	}

	private shutdownWidget(sender: String, msg): void {
		var self = this;

		// remove listener override to prevent looping
		this._WidgetStateController.removeStateEventOverrides({
			events: ['beforeclose'],
			callback: function () {
				//console.log('.. widget shutdown!!');

				// unpublish active track layers

				// unsubcribe the events
				self.subcribedChannels.forEach(element => {
					OWF.Eventing.unsubscribe(element);
				});

				self._WidgetStateController.closeWidget();
			}
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
