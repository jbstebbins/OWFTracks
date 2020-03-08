import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { FieldsetModule } from 'primeng/fieldset';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { DropdownModule } from 'primeng/dropdown';

import { AgGridModule } from 'ag-grid-angular';
import { SharedServicesModule } from '../shared-services/shared-services.module';

import { FeaturesCoreComponent } from './features-core/features-core.component';
import { FeaturesGridComponent } from './features-grid/features-grid.component';

const appRoutes: Routes = [
  {
    path: 'service', component: FeaturesCoreComponent, outlet: 'trackOutlet',
    children: [
      {
        path: 'connect.feature',
        component: FeaturesGridComponent
      }
    ]
  }
];

@NgModule({
  declarations: [FeaturesCoreComponent, FeaturesGridComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(appRoutes),
    FormsModule,
    FieldsetModule,
    TabViewModule,
    CardModule,
    PanelModule,
    DropdownModule,
    AgGridModule.withComponents([]),
    SharedServicesModule.forRoot()
  ],
  exports: [FeaturesCoreComponent, FeaturesGridComponent]
})
export class FeaturesCoreModule { }
