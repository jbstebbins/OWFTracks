import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { FieldsetModule } from 'primeng/fieldset';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';

import { AgGridModule } from 'ag-grid-angular';
import { SharedServicesModule } from '../shared-services/shared-services.module';

import { CsvCoreComponent } from './csv-core/csv-core.component';
import { CsvGridComponent } from './csv-grid/csv-grid.component';

const appRoutes: Routes = [
  {
    path: 'service', component: CsvCoreComponent, outlet: 'trackOutlet',
    children: [
      {
        path: 'connect.csv',
        component: CsvCoreComponent
      }
    ]
  }
];

@NgModule({
  declarations: [CsvCoreComponent, CsvGridComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(appRoutes),
    FieldsetModule,
    TabViewModule,
    CardModule,
    PanelModule,
    AgGridModule.withComponents([]),
    SharedServicesModule.forRoot()
  ],
  exports: [CsvCoreComponent, CsvGridComponent]
})
export class CsvCoreModule { }
