import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { ChartsModule } from 'ng2-charts';
import { Daterangepicker } from 'ng2-daterangepicker';

import { AppComponent, DialogOverviewExampleDialog } from './app.component';
import { ContentAuditing, DialogOverviewExampleDialogContent } from './auditContent/contentAuditing.component';

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTabsModule} from '@angular/material/tabs';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDialogModule} from '@angular/material/dialog';

registerLocaleData(localeFr, 'fr');


@NgModule({
  declarations: [
    AppComponent,
    DialogOverviewExampleDialog,
    DialogOverviewExampleDialogContent,
    ContentAuditing
  ],
  imports: [
    BrowserModule,
    ChartsModule,
    Daterangepicker,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatTabsModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    HttpModule
  ],
  bootstrap: [AppComponent], entryComponents:[DialogOverviewExampleDialog, DialogOverviewExampleDialogContent]
})
export class AppModule {
 }
