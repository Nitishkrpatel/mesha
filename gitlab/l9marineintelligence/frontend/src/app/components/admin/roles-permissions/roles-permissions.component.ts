import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { MessageService } from "../../shared/message.service";
import { ServiceService } from "../../shared/service.service";
import { Sort } from "@angular/material/sort";
import { Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-roles-permissions",
  templateUrl: "./roles-permissions.component.html",
  styleUrls: ["./roles-permissions.component.scss"],
})
export class RolesPermissionsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  // Subscription for roles
  rolesSub!: Subscription;
  // Flag for role and permission section
  roleandpermission = false;
  // Array to store all roles details
  allRolesDetails: any[] = [];
  // Array to store sorted roles data
  allRolesSortedData: any[] = [];
  // Number of items per page
  itemsPerPage = 0;
  // Total number of current page
  totalCurrentPage!: number;
  // Array to store all features
  allFeatures: any[] = [];

  // Flags for new and edit role
  newRole = false;
  editRole = false;
  // Flag for add new role form submission
  addnewRoleSubmitted = false;

  // Variables for edit role status and image
  editroleStatus = "";
  editroleImg = "";

  // Variables for deleting role
  deletingrole: any;
  deletingroleName: any;

  // Total count of roles
  totalRolesCount = 0;

  // Count for roles search
  rolesSearchCount = 0;
  // Count for searched text
  seachedTextCount = 0;
  // Theme variable
  theme = "";

  constructor(
    private service: ServiceService,
    private msgservice: MessageService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Set the number of items per page
    this.itemsPerPage = 12;
  }

  ngAfterViewInit(): void {
    // Update the selected image for Roles in the view
    if (document.getElementById("Roles") !== null) {
      document
        .getElementById("Roles_img")!
        .setAttribute("src", "assets/admin-img/selected/Roles.svg");
    }
    // Set the roleandpermission flag to true
    this.roleandpermission = true;
    // Fetch all roles
    this.getAllRoles();
    // Set newRole and editRole flags to false initially
    this.newRole = false;
    this.editRole = false;
  }

  // Create form group for roles search
  rolesSearchForm = new FormGroup({
    roles_search_text: new FormControl(""),
  });

  // Create form group for adding new role
  addNewRoleForm: any = new FormGroup({
    role: new FormControl("", [Validators.required]),
    features: new FormControl([], [Validators.required]),
  });

  get n(): any {
    return this.addNewRoleForm.controls;
  }

  // Create form group for editing role
  editRoleForm: any = new FormGroup({
    role: new FormControl(""),
    features: new FormControl([]),
  });

  get e(): any {
    return this.editRoleForm.controls;
  }

  // Fetch all roles
  getAllRoles(): void {
    this.service.getAllRolesAndPermission().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          // Update roles data and count
          this.allRolesDetails = result.data;
          this.allRolesSortedData = this.allRolesDetails.slice();
          this.totalRolesCount = this.allRolesSortedData.length;
          this.totalCurrentPage = 1;
        }
      },
      error: (error: any) => {
        // Handle errors from the service
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  // Open new page to add new role
  openAddNewRole(): void {
    this.newRole = true;
    this.editRole = false;
    // Fetch all features for new role
    this.getAllFeatures();
  }

  // Fetch all features
  getAllFeatures(): void {
    this.service.getAllFeatures().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.allFeatures = result.data;
        }
      },
      error: (error: any) => {
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  // Add new role
  addNewRole(): void {
    this.addnewRoleSubmitted = true;
    if (this.addNewRoleForm.value.features.length === 0) {
      this.addNewRoleForm.controls.features.setErrors({ required: true });
      return;
    }
    if (this.addNewRoleForm.invalid) {
      return;
    }
    this.service.addNewRole(this.addNewRoleForm.value).subscribe({
      next: (data: any) => {
        if (data.status === "success") {
          // Display success message and update roles data
          this.toastr.success(
            "New role " + this.addNewRoleForm.value.role + " is added",
            "",
            {
              timeOut: 3000,
            }
          );
          this.getAllRoles();
          // Navigate back to manage roles
          this.backToManageRoles();
        }
      },
      error: (error: any) => {
        // Handle errors from the service
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // Search for the role in the table
  getSearchResultForRoles(e: any): void {
    const data = this.allRolesDetails.filter((obj) => {
      if (obj.role !== null) {
        const role = obj.role.toString().toUpperCase();
        if (role.indexOf(e.toUpperCase()) >= 0) {
          return obj;
        }
      }

      if (obj.fname !== null) {
        const feature = obj.fname.toString().toUpperCase();
        if (feature.indexOf(e.toUpperCase()) >= 0) {
          return obj;
        }
      }
    });

    // Update roles data based on search
    this.allRolesSortedData = data.slice();
    this.rolesSearchCount = this.allRolesSortedData.length;
    this.seachedTextCount = e.length;
    this.totalRolesCount = this.allRolesSortedData.length;
    this.totalCurrentPage = 1;
  }

  // Clear search
  clearSearch(): void {
    this.rolesSearchForm.setValue({ roles_search_text: "" });
    this.getSearchResultForRoles("");
  }

  // Sort roles data
  sortRolesData(sort: Sort): any {
    const data = this.allRolesSortedData.slice();

    if (!sort.active || sort.direction === "") {
      this.allRolesSortedData = data;
      return;
    }
    this.allRolesSortedData = data.sort((a, b) => {
      const isAsc = sort.direction === "asc";
      switch (sort.active) {
        case "role":
          return this.compare(a.role, b.role, isAsc);
        case "fname":
          return this.compare(a.fname, b.fname, isAsc);
        case "status":
          return this.compare(a.status, b.status, isAsc);
        default:
          return 0;
      }
    });
  }

  // Helper function to compare values for sorting
  compare(a: number | string, b: number | string, isAsc: boolean): any {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  // Open new page to edit role
  openEditRolesInfo(r: any): void {
    this.newRole = false;
    this.editRole = true;
    // Fetch all features for editing role
    this.getAllFeatures();
    this.editRoleForm.setValue({
      role: r.role,
      features: r.fid,
    });
  }

  // Update role information
  updateRoleInfo(): void {
    if (this.editRoleForm.value.features.length === 0) {
      this.editRoleForm.controls.features.setErrors({ min: true });
      return;
    }
    this.service.editRole(this.editRoleForm.value).subscribe({
      next: (data) => {
        if (data.status === "success") {
          // Display success message and update roles data
          this.toastr.success("Updated " + this.editRoleForm.value.role, "", {
            timeOut: 3000,
          });
          this.getAllRoles();
          // Navigate back to manage roles
          this.backToManageRoles();
        }
      },
      error: (error) => {
        // Handle errors from the service
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // Open model to confirm role deletion
  deleteRoleOpenModel(role: any): void {
    document.getElementById("openroledeleteModel")!.click();
    this.deletingrole = role;
    this.deletingroleName = role.role;
  }

  // Delete role
  deleteRole(): void {
    this.service.deleteRole(this.deletingrole.roleid).subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          // Display success message and update roles data
          this.toastr.success("Deleted role " + this.deletingrole.role, "", {
            timeOut: 3000,
          });
          document.getElementById("closedeleterolemodel")!.click();
          this.getAllRoles();
        }
      },
      error: (error: any) => {
        document.getElementById("closedeleterolemodel")!.click();
        // Handle errors from the service
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  // Back to main page
  backToManageRoles(): void {
    this.newRole = false;
    this.editRole = false;
    this.editRoleForm.setValue({ role: "", features: [] });
    this.addNewRoleForm.setValue({ role: "", features: [] });
    this.addnewRoleSubmitted = false;
  }

  // Clean up when the component is destroyed
  ngOnDestroy(): void {
    if (document.getElementById("Roles") !== null) {
      document
        .getElementById("Roles_img")!
        .setAttribute("src", "assets/admin-img/admin-console/Roles.svg");
    }

    // Unsubscribe from the roles subscription to prevent memory leaks
    if (this.rolesSub !== undefined) {
      this.rolesSub.unsubscribe();
    }
  }
}
