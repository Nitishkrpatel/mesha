import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { CookieService } from "ngx-cookie-service";
import { MessageService } from "../../shared/message.service";
import { Router } from "@angular/router";
import { ServiceService } from "../../shared/service.service";
import jwt_decode from "jwt-decode";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  // Flag to track whether the form has been submitted
  submitted = false;

  // Icon for password visibility toggle
  pwdicon = "visibility_off";

  // Variables to store decoded token information
  decodedToken: any;
  roles: any;
  speed: any;
  adjustDateTimeFlag: any;
  username: any;
  clockStatus: any;

  constructor(
    private service: ServiceService,
    private router: Router,
    private msgservice: MessageService,
    private cookieService: CookieService
  ) {}

  // Reactive form group for login
  loginForm = new FormGroup({
    userid: new FormControl("", [
      Validators.required,
      Validators.pattern(/[a-zA-Z0-9-_]/),
    ]),
    password: new FormControl("", [Validators.required]),
  });

  // Getter for easy access to form controls
  get lf(): any {
    return this.loginForm.controls;
  }

  ngOnInit(): void {
    // Initialization code can go here if needed
  }

  // Decode JWT token and initialize user-related information
  initializeDecodedToken() {
    const jwtToken = this.cookieService.get("miutkn");
    this.decodedToken = jwt_decode(jwtToken) as { [key: string]: any };
    // Extracting user-related information from the decoded token
    this.speed = this.decodedToken.speed;
    this.clockStatus = this.decodedToken.is_pause.toLowerCase();
    this.cookieService.set("speed", this.speed);
    this.cookieService.set("clockStatus", this.clockStatus);
    this.adjustDateTimeFlag = this.decodedToken.adjtime_flag.toLowerCase();
    this.cookieService.set("adjustDateTimeFlag", this.adjustDateTimeFlag);
    this.username = this.decodedToken.username;
    this.roles = this.decodedToken.role.trim().split(" ").join(",");
    this.cookieService.set("plotTime", this.decodedToken.plot_time);
  }

  // Handle the login process
  logIn() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      // Exit if the form is invalid
      return;
    }

    // Call the user login service
    this.service.userLogin(this.loginForm.value).subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          // Display success message
          this.msgservice.success("login successfully");
          // Set the JWT token in the cookie
          this.cookieService.set("miutkn", result.token);
          // Initialize user-related information
          this.initializeDecodedToken();
          // Navigate based on user role
          if (this.roles === "SuperAdmin") {
            this.router.navigateByUrl("/admin-console");
          } else {
            this.router.navigateByUrl("/anomaly-info");
          }
        }
      },
      error: (error: any) => {
        // Display error message
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // Toggle password visibility
  showPassword(): void {
    const inputType = document.getElementById("password")!.getAttribute("type");
    if (inputType === "password") {
      document.getElementById("password")!.setAttribute("type", "text");
      this.pwdicon = "visibility";
    } else if (inputType === "text") {
      document.getElementById("password")!.setAttribute("type", "password");
      this.pwdicon = "visibility_off";
    }
  }
}
