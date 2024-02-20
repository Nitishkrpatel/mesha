import * as _moment from 'moment';

import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';

import { AdminConsoleComponent } from './components/admin/admin-console/admin-console.component';
import { AnomalyInfoComponent } from './components/dashboard/anomaly-info/anomaly-info.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { ForgotPasswordComponent } from './components/account/forgot-password/forgot-password.component';
import { ForgotUsernameComponent } from './components/account/forgot-username/forgot-username.component';
import { HeadersInterceptor } from './headers.interceptor';
import { LoginComponent } from './components/account/login/login.component';
import { MainNavbarComponent } from './components/main-navbar/main-navbar.component';
import { ManageUsersComponent } from './components/admin/manage-users/manage-users.component';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import {MatSortModule} from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxPaginationModule } from 'ngx-pagination';
import { OverlappingAnomalyComponent } from './components/dashboard/overlapping-anomaly/overlapping-anomaly.component';
import { OverviewComponent } from './components/dashboard/overview/overview.component';
import { PlayHistoryComponent } from './components/play-history/play-history.component';
import { QueueRequestComponent } from './components/admin/queue-request/queue-request.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RegionOfInterestComponent } from './components/region-of-interest/region-of-interest.component';
import { RegisterComponent } from './components/account/register/register.component';
import { RolesPermissionsComponent } from './components/admin/roles-permissions/roles-permissions.component';
import { ShipMapComponent } from './components/ship-map/ship-map.component';
import { ShipOfInterestComponent } from './components/ship-of-interest/ship-of-interest.component';
import { ShiptypeAnomalyComponent } from './components/dashboard/shiptype-anomaly/shiptype-anomaly.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { SpeedAnomalyComponent } from './components/dashboard/speed-anomaly/speed-anomaly.component';
import { ToastrModule } from 'ngx-toastr';
import { TransmissionAnomalyComponent } from './components/dashboard/transmission-anomaly/transmission-anomaly.component';
import { VesselFilterComponent } from './components/vessel-filter/vessel-filter.component';

export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ForgotUsernameComponent,
    ShipMapComponent,
    MainNavbarComponent,
    AdminConsoleComponent,
    SidenavComponent,
    ShipOfInterestComponent,
    OverviewComponent,
    AnomalyInfoComponent,
    PlayHistoryComponent,
    SpeedAnomalyComponent,
    ShiptypeAnomalyComponent,
    TransmissionAnomalyComponent,
    RegionOfInterestComponent,
    OverlappingAnomalyComponent,
    QueueRequestComponent,
    ManageUsersComponent,
    RolesPermissionsComponent,
    VesselFilterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatDividerModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    HttpClientModule,
    MatTooltipModule,
    MatRadioModule,
    OwlDateTimeModule,
    MatCardModule,
    OwlNativeDateTimeModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatDatepickerModule,
    NgxPaginationModule,
    MatSortModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ToastrModule.forRoot({}),
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HeadersInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
