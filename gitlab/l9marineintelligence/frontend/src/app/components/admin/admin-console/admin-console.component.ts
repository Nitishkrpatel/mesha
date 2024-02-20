// Import necessary Angular modules and services
import { Component, OnInit } from "@angular/core";

// Import third-party library for decoding JWT tokens
import { CookieService } from "ngx-cookie-service";
import jwt_decode from "jwt-decode";

@Component({
  selector: "app-admin-console",
  templateUrl: "./admin-console.component.html",
  styleUrls: ["./admin-console.component.scss"],
})
export class AdminConsoleComponent implements OnInit {
  // Data for the admin console menu
  adminConsoleData = [
    {
      name: "Queue Requests",
      img: "Queue-Requests",
      routePath: "queue-request",
    },
    { name: "Manage Users", img: "Manage-Users", routePath: "manage-users" },
    {
      name: "Roles & Permissions",
      img: "Roles",
      routePath: "roles-permissions",
    },
  ];

  // Variable to store the username
  userName!: string;

  // Variable to store the user role
  role = "";

  // Constructor to inject necessary services
  constructor(private cookieService: CookieService) {}

  // Lifecycle hook - executes when the component is initialized
  ngOnInit(): void {
    // Initialize decoded token to extract user information
    this.initializeDecodedToken();
  }

  // Function to decode JWT token and extract user information
  initializeDecodedToken() {
    // Get JWT token from the cookie
    const jwtToken = this.cookieService.get("miutkn");

    // Decode JWT token to extract user information
    const decodedToken: any = jwt_decode(jwtToken) as { [key: string]: any };

    // Set the username and role based on the decoded token
    this.userName = decodedToken.username;
    this.role = decodedToken.role.trim().split(" ").join(",");
  }
}
