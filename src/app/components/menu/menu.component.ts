import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ActionNotificationService } from '../../services/action-notification.service';
import { MenuModel } from '../../models/menu-model';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy {
  menuItems: MenuModel;
  searchText: string = 'Search';
  subscription: Subscription;

  isAvailable: boolean = false;

  constructor(private notificationService: ActionNotificationService) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        //console.log(`${payload.action}, received by MenuComponent`);
      }
    );
  }

  ngOnInit() {
    this.menuItems = new MenuModel();

    // add commands to menu model
    let items: any = this.menuItems;

    items.items[0].items[0].command = this.notifyMenu.bind(this);  // Service -> Load CSV
    items.items[0].items[1].command = this.notifyMenu.bind(this);  // Service -> Load Feature
    //items.items[0].items[2].command = this.notifyMenu.bind(this);  // Service -> Load Rest
    //items.items[1].items[0].command = this.notifyMenu.bind(this);  // help -> about
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

  notifyMenu(event) {
    this.notificationService.subscriberAction({action:event.item.label});
    this.searchText = event.item.label;
    //console.log(`${event.item.label}, pressed from MenuComponent`);
  }

  onSearchEnter(value: string) {
    if (value === '') {
      this.searchText = 'Search';
    } else {
      this.searchText = value;
    }

    //console.log(`search value: ${value}`);
    this.notificationService.subscriberAction({action:"search", data:value});
  }

}
