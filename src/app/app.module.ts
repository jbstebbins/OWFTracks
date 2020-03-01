import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AgGridModule } from 'ag-grid-angular';
import { SharedServicesModule, SharedComponents } from './modules/shared-services/shared-services.module';

import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';

import { MenuComponent } from './components/menu/menu.component';
import { GrowlerComponent } from './components/growler/growler.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';

import { TrackCoreModule } from './modules/track/track-core.module';
import { CsvCoreModule } from './modules/csv/csv-core.module';

const routes: Routes = [
  { path: 'service', loadChildren: './modules/track/track-core.module#TrackCoreModule' },
  { path: 'service', loadChildren: './modules/csv/csv-core.module#CsvCoreModule' },
  { path: '', redirectTo: '/', pathMatch: 'full' },
  { path: 'message/:type', component: GrowlerComponent },
  { path: '**', component: PageNotFoundComponent, outlet: 'trackOutlet' },
  { path: '**', component: PageNotFoundComponent, outlet: 'errorOutlet' },
  { path: '**', redirectTo: 'message' }
];

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    PageNotFoundComponent,
    GrowlerComponent,
    SharedComponents
  ],
  imports: [
    RouterModule.forRoot(routes,
      { /* enableTracing: true */ }),
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MessagesModule,
    MessageModule,
    ToastModule,
    MenubarModule,
    ButtonModule,
    TrackCoreModule,
    CsvCoreModule,
    AgGridModule.withComponents([]),
    SharedServicesModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
