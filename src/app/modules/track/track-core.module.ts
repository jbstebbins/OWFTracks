import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { FieldsetModule } from 'primeng/fieldset';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';

import { AgGridModule } from 'ag-grid-angular';
import { SharedServicesModule } from '../shared-services/shared-services.module';

import { TrackCoreComponent } from './track-core/track-core.component';
import { CotMinotaurComponent } from './cot-minotaur/cot-minotaur.component';

const appRoutes: Routes = [
  {
    path: 'service', component: TrackCoreComponent, outlet: 'trackOutlet',
    children: [
      {
        path: 'connect.rest',
        component: CotMinotaurComponent
      }
    ]
  }
];

@NgModule({
  declarations: [TrackCoreComponent, CotMinotaurComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(appRoutes),
    FieldsetModule,
    TabViewModule,
    CardModule,
    PanelModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    AgGridModule.withComponents([]),
    SharedServicesModule.forRoot()
  ],
  exports: [TrackCoreComponent, CotMinotaurComponent]
})
export class TrackCoreModule { }
