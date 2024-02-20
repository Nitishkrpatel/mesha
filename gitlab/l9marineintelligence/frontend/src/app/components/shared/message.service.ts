import { Injectable, OnInit } from '@angular/core';

import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { ServiceService } from './service.service';
import { ToastrService } from 'ngx-toastr';
import { formatDate } from '@angular/common';
import jwt_decode from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  decodedToken: any;
  roles: any;
  username: any;

  constructor(
    private toastr: ToastrService,
    private cookieService: CookieService,
    private service: ServiceService,
    private router: Router
  ) {
    this.initializeDecodedToken();
  }

  initializeDecodedToken() {
    try {
      const jwtToken = this.cookieService.get('miutkn');
      this.decodedToken = jwt_decode(jwtToken) as { [key: string]: any };
      if (jwtToken !== undefined) {
        this.username = this.decodedToken.username;
        this.roles = this.decodedToken.role.split(' ').join(',');
      }
    } catch (error) {
      // console.error('Error decoding JWT token:', error);
    }
  }

  success(message: string) {
    this.toastr.success(message, '', { timeOut: 3000 });
  }

  failure(message: string) {
    this.toastr.warning(message, '', {
      timeOut: 3000,
    });
  }

  logOutUser(data: any) {
    this.service.logout(data).subscribe({
      next: (result: any) => {
        if (result.status === 'success') {
          this.cookieService.deleteAll();
          this.toastr.success(result.message, '', { timeOut: 3000 });
          this.router.navigateByUrl('');
        }
      },
      error: (error: any) => {
        this.postErrorFunc(error);
      },
    });
  }

  getErrorFunc(error: any) {
    if (error.error.status === 'failure') {
      this.toastr.warning(error.error.message, '', {
        timeOut: 3000,
      });
    } else if (error.error.status === 'error') {
      this.toastr.warning(error.error.message, '', {
        timeOut: 3000,
      });
    } else if (error.error.status === 'logout') {
      this.toastr.warning(error.error.message, '', {
        timeOut: 3000,
      });
      this.logOutUser(this.username);
    } else {
      this.toastr.warning('Please retry!', '', {
        timeOut: 3000,
      });
    }
  }

  postErrorFunc(error: any) {
    if (error.error.status === 'failure') {
      this.toastr.warning(error.error.message, '', {
        timeOut: 3000,
      });
    } else if (error.error.status === 'error') {
      this.toastr.warning(error.error.message, '', {
        timeOut: 3000,
      });
    } else if (error.error.status === 'logout') {
      this.toastr.warning(error.error.message, '', {
        timeOut: 3000,
      });
      this.logOutUser(this.username);
    } else {
      this.toastr.warning('Please retry!', '', {
        timeOut: 3000,
      });
    }
  }

  // Calculate time in ship Map
  getCalculatedTime(
    time: string | number | Date,
    speed: string,
    refreshAt: number
  ): any {
    let calculatedtime;
    const a: Date = new Date(time);
    const speedinmilisec = Number(speed.replace('x', '')) * refreshAt;
    calculatedtime = new Date(a.getTime() + speedinmilisec);
    calculatedtime = formatDate(calculatedtime, 'yyyy-MM-dd HH:mm:ss', 'en-US');
    return calculatedtime;
  }
}
