import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { FieldsetModule } from 'primeng/fieldset';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';

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
    FormsModule,
    FieldsetModule,
    TabViewModule,
    CardModule,
    PanelModule,
    ColorPickerModule,
    ButtonModule,
    CheckboxModule,
    DropdownModule,
    AgGridModule.withComponents([]),
    SharedServicesModule.forRoot()
  ],
  exports: [CsvCoreComponent, CsvGridComponent]
})
export class CsvCoreModule { }
