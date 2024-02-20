import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";

import { CookieService } from "ngx-cookie-service";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ServiceService } from "./service.service";

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(
    private service: ServiceService,
    private router: Router,
    private cookieService: CookieService
  ) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const token = this.cookieService.get("miutkn");
    if (token) {
      return true;
    } else {
      this.router.navigateByUrl("/");
      return false;
    }
  }
}
