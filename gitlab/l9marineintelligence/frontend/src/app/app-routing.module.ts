import { RouterModule, Routes } from "@angular/router";

import { AdminConsoleComponent } from "./components/admin/admin-console/admin-console.component";
import { AnomalyInfoComponent } from "./components/dashboard/anomaly-info/anomaly-info.component";
import { AuthGuard } from "./components/shared/auth.guard";
import { ForgotPasswordComponent } from "./components/account/forgot-password/forgot-password.component";
import { ForgotUsernameComponent } from "./components/account/forgot-username/forgot-username.component";
import { LoginComponent } from "./components/account/login/login.component";
import { ManageUsersComponent } from "./components/admin/manage-users/manage-users.component";
import { NgModule } from "@angular/core";
import { PlayHistoryComponent } from "./components/play-history/play-history.component";
import { QueueRequestComponent } from "./components/admin/queue-request/queue-request.component";
import { RegisterComponent } from "./components/account/register/register.component";
import { RolesPermissionsComponent } from "./components/admin/roles-permissions/roles-permissions.component";
import { ShipMapComponent } from "./components/ship-map/ship-map.component";

const routes: Routes = [
  { path: "", component: LoginComponent },
  { path: "Register", component: RegisterComponent },
  { path: "Forgot-password", component: ForgotPasswordComponent },
  { path: "Forgot-username", component: ForgotUsernameComponent },
  { path: "Ship-map", component: ShipMapComponent, canActivate: [AuthGuard] },
  {
    path: "admin-console",
    component: AdminConsoleComponent,
    children: [
      { path: "", component: QueueRequestComponent },
      { path: "queue-request", component: QueueRequestComponent },
      { path: "manage-users", component: ManageUsersComponent },
      { path: "roles-permissions", component: RolesPermissionsComponent },
    ],
    canActivate: [AuthGuard],
  },
  {
    path: "anomaly-info",
    component: AnomalyInfoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "play-history",
    component: PlayHistoryComponent,
    canActivate: [AuthGuard],
  },
  { path: "**", component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
