import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { MessageService } from "../../shared/message.service";
import { ServiceService } from "../../shared/service.service";
import { Sort } from "@angular/material/sort";
import { Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-manage-users",
  templateUrl: "./manage-users.component.html",
  styleUrls: ["./manage-users.component.scss"],
})
export class ManageUsersComponent implements OnInit, AfterViewInit, OnDestroy {
  musub!: Subscription;
  manageUser = false;
  itemsPerPage!: number;
  totalCurrentPage!: number;
  activeCurrentPage!: number;
  pendingCurrentPage!: number;
  userSearchedCount!: number;
  seachedTextCount = 0;
  allUsers: any[] = [];
  allUsersSortedData: any[] = [];
  totalUserCount = 0;
  activeSortedData: any[] = [];
  activeCount = 0;
  pendingSortedData: any[] = [];
  pendingCount = 0;
  newUser = false;
  editUser = false;
  deletinguser = "";
  allRoles: any[] = [];
  addnewUserSubmitted = false;
  passwordicon = "visibility_off";

  constructor(
    private service: ServiceService,
    private msgservice: MessageService,
    private toastr: ToastrService
  ) {}

  userNameSearchForm = new FormGroup({
    user_search_text: new FormControl(""),
  });

  addNewUserForm: any = new FormGroup({
    name: new FormControl("", [
      Validators.required,
      Validators.pattern(/[a-zA-Z0-9-_]/),
    ]),
    email: new FormControl("", [Validators.required, Validators.email]),
    mobile: new FormControl("", [
      Validators.minLength(10),
      Validators.pattern("^((//+91-?)|0)?[0-9]{10}$"),
    ]),
    user_name: new FormControl("", [Validators.required]),
    paswd: new FormControl("", [Validators.minLength(6), Validators.required]),
    role: new FormControl([], [Validators.required]),
  });

  get n(): any {
    return this.addNewUserForm.controls;
  }

  editUserForm: any = new FormGroup({
    user_name: new FormControl(""),
    name: new FormControl("", [
      Validators.required,
      Validators.pattern(/[a-zA-Z0-9-_]/),
    ]),
    email: new FormControl("", [Validators.email]),
    mobile: new FormControl("", [
      Validators.minLength(10),
      Validators.pattern("^((//+91-?)|0)?[0-9]{10}$"),
    ]),
    role: new FormControl([]),
    status: new FormControl(""),
    temppwd: new FormControl(""),
  });

  get e(): any {
    return this.editUserForm.controls;
  }

  ngOnInit(): void {
    this.itemsPerPage = 8;
  }

  ngAfterViewInit(): void {
    if (document.getElementById("Manage-Users") !== null) {
      document
        .getElementById("Manage-Users_img")!
        .setAttribute("src", "assets/admin-img/selected/Manage-Users.svg");
    }

    this.manageUser = true;
    this.newUser = false;
    this.editUser = false;
    this.getAllUsers();
  }

  // Method to fetch all users from the service
  getAllUsers(): void {
    this.service.getAllUsers().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.allUsers = result.data;
          this.allUsersSortedData = this.allUsers.slice();
          const activeData: any[] = [];
          const pendingData: any[] = [];
          this.allUsersSortedData.forEach((ele) => {
            if (ele.status === false) {
              pendingData.push(ele);
            } else if (ele.status === true) {
              activeData.push(ele);
            }
          });
          this.activeSortedData = activeData.slice();
          this.pendingSortedData = pendingData.slice();
          this.totalUserCount = this.allUsersSortedData.length;
          this.activeCount = this.activeSortedData.length;
          this.pendingCount = this.pendingSortedData.length;
          this.totalCurrentPage = 1;
          this.activeCurrentPage = 1;
          this.pendingCurrentPage = 1;
        }
      },
      error: (error: any) => {
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  // Method to search for users based on input text
  getSearchResultForUser(e: any): void {
    const userdata = this.allUsers.filter((obj) => {
      if (obj.name !== null) {
        const name = obj.name.toString().toUpperCase();
        if (name.indexOf(e.toUpperCase()) >= 0) {
          return obj;
        }
      }

      if (obj.user_name !== null) {
        const user_name = obj.user_name.toString().toUpperCase();
        if (user_name.indexOf(e.toUpperCase()) >= 0) {
          return obj;
        }
      }

      if (obj.role_name !== null) {
        const role = obj.role_name.toString().toUpperCase();
        if (role.indexOf(e.toUpperCase()) >= 0) {
          return obj;
        }
      }
    });
    this.allUsersSortedData = userdata.slice();

    this.totalCurrentPage = 1;
    this.activeCurrentPage = 1;
    this.pendingCurrentPage = 1;

    this.userSearchedCount = this.allUsersSortedData.length;
    this.seachedTextCount = e.length;
    this.totalUserCount = this.allUsersSortedData.length;

    const activeData: any[] = [];
    const pendingData: any[] = [];
    this.allUsersSortedData.forEach((ele) => {
      if (ele.status === false) {
        pendingData.push(ele);
      } else if (ele.status === true) {
        activeData.push(ele);
      }
    });
    this.activeSortedData = activeData.slice();
    this.pendingSortedData = pendingData.slice();
    this.activeCount = this.activeSortedData.length;
    this.pendingCount = this.pendingSortedData.length;
  }

  // Clear Search
  clearSearch(): void {
    this.userNameSearchForm.setValue({ user_search_text: "" });
    this.getSearchResultForUser("");
  }

  // Sort User details
  sortUserData(sort: Sort): any {
    const data = this.allUsersSortedData.slice();

    if (!sort.active || sort.direction === "") {
      this.allUsersSortedData = data;
      return;
    }
    this.allUsersSortedData = data.sort((a, b) => {
      const isAsc = sort.direction === "asc";
      switch (sort.active) {
        case "email":
          return this.compare(a.email, b.email, isAsc);
        case "name":
          return this.compare(a.name, b.name, isAsc);
        case "user_name":
          return this.compare(a.user_name, b.user_name, isAsc);
        case "rolename":
          return this.compare(a.role_name, b.role_name, isAsc);
        case "status":
          return this.compare(a.status, b.status, isAsc);
        default:
          return 0;
      }
    });

    this.activeSortedData = this.activeSortedData.sort((a, b) => {
      const isAsc = sort.direction === "asc";
      switch (sort.active) {
        case "email":
          return this.compare(a.email, b.email, isAsc);
        case "name":
          return this.compare(a.name, b.name, isAsc);
        case "user_name":
          return this.compare(a.user_name, b.user_name, isAsc);
        case "rolename":
          return this.compare(a.role_name, b.role_name, isAsc);
        case "status":
          return this.compare(a.status, b.status, isAsc);
        default:
          return 0;
      }
    });

    this.pendingSortedData = this.pendingSortedData.sort((a, b) => {
      const isAsc = sort.direction === "asc";
      switch (sort.active) {
        case "email":
          return this.compare(a.email, b.email, isAsc);
        case "name":
          return this.compare(a.name, b.name, isAsc);
        case "user_name":
          return this.compare(a.user_name, b.user_name, isAsc);
        case "rolename":
          return this.compare(a.role_name, b.role_name, isAsc);
        case "status":
          return this.compare(a.status, b.status, isAsc);
        default:
          return 0;
      }
    });
  }
  // Comparison function for sorting
  compare(a: number | string, b: number | string, isAsc: boolean): any {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  // Restrict users to enter only number.
  onlyNumberKey(event: any): any {
    return event.charCode === 8 || event.charCode === 0
      ? null
      : event.charCode >= 48 && event.charCode <= 57;
  }

  // Restrict users to enter only alphanumeric and space value.
  validateFullName(event: KeyboardEvent): void {
    const regex = /^[a-zA-Z\s]+$/;
    const input = event.target as HTMLInputElement;
    const inputValue = input.value + event.key;
    const isValidKey = /[a-zA-Z ]/i.test(event.key);

    if (!isValidKey || !regex.test(inputValue)) {
      event.preventDefault();
    }
  }

  // Method to check if a user ID or email ID already exists
  checkUserIdOrEmailId(data: string, process: string): void {
    let isEmail: any;
    let text: any;

    if (process === "add") {
      if (data === "username") {
        isEmail = "0";
        text = this.addNewUserForm.value.user_name;
      } else {
        text = this.addNewUserForm.value.email;
      }
    } else if (process === "edit") {
      text = this.editUserForm.value.email;
      if (data === "username") {
        isEmail = "0";
        text = this.editUserForm.value.username;
      }
    }

    if (data === "email") {
      isEmail = "1";
    }

    const reqData = {
      is_email: isEmail,
      text: text,
    };
    this.service.checkUserIdOrEmailId(reqData).subscribe({
      next: (result: { status: string }) => {
        if (result.status === "success") {
          // Handle success if needed
        }
      },
      error: (error: { error: any }) => {
        this.msgservice.postErrorFunc(error);

        if (error.error.status === "failure") {
          if (isEmail === "1") {
            this.editUserForm.controls.email.setErrors({ duplicate: true });
            if (process === "add") {
              this.addNewUserForm.controls.email.setErrors({ duplicate: true });
            }
          } else if (isEmail === "0") {
            this.editUserForm.controls.email.setErrors({ duplicate: true });
            if (process === "add") {
              this.addNewUserForm.controls.email.setErrors({ duplicate: true });
              if (data === "username") {
                this.addNewUserForm.controls.user_name.setErrors({
                  duplicate: true,
                });
              }
            }
          }
        }
      },
    });
  }

  // Method to open the Add New User page
  openAddNewUser(): void {
    this.newUser = true;
    this.editUser = false;
    this.getAllRoles();
  }

  // Method to fetch all user roles
  getAllRoles(): void {
    this.service.getAllRoles().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.allRoles = result.data;
        }
      },
      error: (error: any) => {
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  // Method to toggle password visibility
  showPassword(): void {
    const inputType = document.getElementById("password")!.getAttribute("type");
    if (inputType === "password") {
      document.getElementById("password")!.setAttribute("type", "text");
      this.passwordicon = "visibility";
    } else if (inputType === "text") {
      document.getElementById("password")!.setAttribute("type", "password");
      this.passwordicon = "visibility_off";
    }
  }

  // Method to add a new user
  addNewUser(): void {
    this.addnewUserSubmitted = true;
    if (this.addNewUserForm.value.role === undefined) {
      this.addNewUserForm.controls.role.setErrors({ required: true });
      return;
    }
    if (this.addNewUserForm.invalid) {
      return;
    }
    this.service.addNewUser(this.addNewUserForm.value).subscribe({
      next: (data: any) => {
        if (data.status === "success") {
          this.toastr.success(
            "New User " + this.addNewUserForm.value.user_name + " is added",
            "",
            {
              timeOut: 3000,
            }
          );
          this.getAllUsers();
          this.backToManageUser();
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // Method to open the Edit User page
  openEditUserInfo(s: any): void {
    this.newUser = false;
    this.editUser = true;
    this.getAllRoles();
    this.editUserForm.setValue({
      user_name: s.user_name,
      name: s.name,
      email: s.email,
      mobile: s.mobile,
      role: s.role_id,
      status: s.status,
      temppwd: "",
    });
  }

  // Method to update user information
  updateUserInfo(): void {
    if (this.editUserForm.value.role.length === 0) {
      this.editUserForm.controls.role.setErrors({ min: true });
      return;
    }
    this.service.editUser(this.editUserForm.value).subscribe({
      next: (data: any) => {
        if (data.status === "success") {
          this.toastr.success(
            "Updated " + this.editUserForm.value.user_name,
            "",
            {
              timeOut: 3000,
            }
          );
          this.getAllUsers();
          this.backToManageUser();
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // Method to open the user deletion confirmation modal
  deleteUserOpenModel(user_name: any): void {
    document.getElementById("openuserdeleteModel")!.click();
    this.deletinguser = user_name;
  }

  // Method to delete a user
  deleteUser(): void {
    this.service.deleteUser(this.deletinguser).subscribe(
      (result: any) => {
        if (result.status === "success") {
          this.toastr.success("Deleted user " + result.data, "", {
            timeOut: 3000,
          });
          document.getElementById("closedeleteusermodel")!.click();
          this.getAllUsers();
        }
      },
      (error: any) => {
        this.msgservice.getErrorFunc(error);
      }
    );
  }

  // Method to navigate back to the main Manage User page
  backToManageUser(): void {
    this.newUser = false;
    this.editUser = false;
    this.editUserForm.setValue({
      user_name: "",
      name: "",
      email: "",
      mobile: "",
      role: "",
      status: "",
      temppwd: "",
    });
    this.addNewUserForm.setValue({
      name: "",
      email: "",
      mobile: "",
      user_name: "",
      paswd: "",
      role: "",
    });
  }

  // Component lifecycle hook when the component is about to be destroyed
  ngOnDestroy(): void {
    if (document.getElementById("Manage-Users") !== null) {
      document
        .getElementById("Manage-Users_img")!
        .setAttribute("src", "assets/admin-img/admin-console/Manage-Users.svg");
    }
    if (this.musub !== undefined) {
      this.musub.unsubscribe();
    }
  }
}
