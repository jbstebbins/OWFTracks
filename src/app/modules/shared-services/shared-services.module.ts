import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionNotificationService } from '../../services/action-notification.service';
import { ConfigService } from '../../services/config.service';
import { PreferencesService } from '../../services/preferences.service';
import { MapMessagesService } from '../../services/map-messages.service';

@NgModule({})
export class SharedServicesModule { 
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedServicesModule,
      providers: [ActionNotificationService, ConfigService, PreferencesService, MapMessagesService]
    };
  }
 }

export const SharedComponents = [];