import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { MessageService } from "../../shared/message.service";
import { ServiceService } from "./../../shared/service.service";

@Component({
  selector: "app-queue-request",
  templateUrl: "./queue-request.component.html",
  styleUrls: ["./queue-request.component.scss"],
})
export class QueueRequestComponent implements OnInit, AfterViewInit, OnDestroy {
  newActCreationRequests: any[] = [];
  accountCreationCnt = 0;
  allRoles: any;
  rolesubmitted = false;
  forgotPasswordDetails: any = [];
  forgotPasswordCnt = 0;
  forgotUsernameDetails: any[] = [];
  forgotUsernameCnt = 0;
  pwdicon = "grey-visibility_off";
  createTempPwdFormSubmit = false;
  showUsername = false;
  usernames: string[] = [];
  usernameVisibility: boolean[] = [];

  constructor(
    private service: ServiceService,
    private msgservice: MessageService
  ) {}

  selectRoleForm = new FormGroup({
    request_id: new FormControl(),
    role: new FormControl("", [Validators.required]),
  });

  get r(): any {
    return this.selectRoleForm.controls;
  }

  createTempPwdForm = new FormGroup({
    request_id: new FormControl(),
    temp_pwd: new FormControl("", [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  get t(): any {
    return this.createTempPwdForm.controls;
  }

  ngOnInit(): void {
    this.getAllUserRequests();
  }

  ngAfterViewInit(): void {
    if (document.getElementById("Queue-Requests") !== null) {
      document
        .getElementById("Queue-Requests_img")!
        .setAttribute("src", "assets/admin-img/selected/Queue-Requests.svg");
      document
        .getElementById("Queue-Requests")!
        .setAttribute("class", "active");
    }
  }

  // Fetch all user requests
  getAllUserRequests() {
    this.service.getAllUserRequests().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.newActCreationRequests = result.acc;
          this.accountCreationCnt = result.ac;
          this.forgotPasswordDetails = result.pwd;
          this.forgotPasswordCnt = result.pc;
          this.forgotUsernameDetails = result.unm;
          this.forgotUsernameCnt = result.uc;
          this.usernameVisibility = Array(
            this.forgotUsernameDetails.length
          ).fill(false);
        }
      },
      error: (error: any) => {
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  // Open role selection model for a specific user request
  openRoleSelectModel(reqid: any) {
    document.getElementById("openrolemodel")!.click();
    this.selectRoleForm.setValue({
      request_id: reqid,
      role: "",
    });
    this.getAllRoles();
  }

  // Fetch all roles from the service
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

  // Submit selected roles for a user request
  submitSelectedRoles(): void {
    this.rolesubmitted = true;
    if (this.selectRoleForm.controls.role.value === "") {
      this.selectRoleForm.controls.role.setErrors({ required: true });
    }
    if (this.selectRoleForm.invalid) {
      return;
    }
    const requestData = {
      status: true,
      request_id: this.selectRoleForm.value.request_id,
      role: this.selectRoleForm.controls.role.value,
    };
    this.newUserRequestApproval(requestData);
    document.getElementById("cancelModel")!.click();
  }

  // Decline a new user request
  declineNewUserRequest(request_id: any): void {
    const requestData = {
      status: false,
      request_id: request_id,
      role: this.selectRoleForm.controls.role.value,
    };
    this.newUserRequestApproval(requestData);
  }

  // Process approval or rejection of a new user request
  newUserRequestApproval(requestData: any) {
    this.service.requestApproval(requestData).subscribe(
      (result: any) => {
        if (result.status === "success") {
          this.getAllUserRequests();
          if (requestData.status === false) {
            this.msgservice.success("New User Request Declined");
          }
        }
      },
      (error: any) => {
        this.msgservice.postErrorFunc(error);
      }
    );
  }

  // Toggle visibility of password for temporary password creation
  showPassword(): void {
    const inputType = document
      .getElementById("temp-password")!
      .getAttribute("type");
    if (inputType === "password") {
      document.getElementById("temp-password")!.setAttribute("type", "text");
      this.pwdicon = "visibility";
    } else if (inputType === "text") {
      document
        .getElementById("temp-password")!
        .setAttribute("type", "password");
      this.pwdicon = "grey-visibility_off";
    }
  }

  // Open the modal to decline creating a temporary password
  declineCreateTemPwdModel(reqid: any, action: any) {
    const requestData = { status: false, request_id: reqid };
    this.requestTempPwd(requestData);
  }

  // Open the modal to create a temporary password
  createTemPwd(reqid: any, action: any) {
    this.createTempPwdForm.setValue({
      request_id: reqid,
      temp_pwd: "",
    });
    document.getElementById("opencreateTemPwdModal")!.click();
  }

  // Request creation of a temporary password
  requestTempPwd(requestData: any) {
    this.service.createTempPwd(requestData).subscribe(
      (result: any) => {
        if (result.status === "success") {
          this.getAllUserRequests();
          if (requestData.status === false) {
            this.msgservice.success("Reset Password Declined");
          } else {
            this.msgservice.success("Temporary Password Reset Success");
          }
        }
      },
      (error: any) => {
        this.msgservice.postErrorFunc(error);
      }
    );
  }

  // Submit the created temporary password
  submitTempPwd() {
    this.createTempPwdFormSubmit = true;
    if (this.createTempPwdForm.invalid) {
      return;
    }
    const requestData = {
      status: true,
      request_id: this.createTempPwdForm.value.request_id,
      password: this.createTempPwdForm.value.temp_pwd,
    };
    this.requestTempPwd(requestData);
    document.getElementById("cancelTempPwdModel")!.click();
  }

  // Process approval or rejection of a forgot username request
  processUsernameRequest(reqid: any, status: any, index: number) {
    const requestData = { request_id: reqid, status: status };
    this.service.getForgotUsername(requestData).subscribe({
      next: (result: any) => {
        if (result.status === "success" && status === false) {
          this.getAllUserRequests();
        } else if (result.username) {
          this.usernameVisibility[index] = !this.usernameVisibility[index];
          this.usernames[index] = result.username;
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // Destroy component and reset image and class attributes
  ngOnDestroy(): void {
    if (document.getElementById("Queue-Requests") !== null) {
      document
        .getElementById("Queue-Requests_img")!
        .setAttribute(
          "src",
          "assets/admin-img/admin-console/Queue-Requests.svg"
        );
      document.getElementById("Queue-Requests")!.setAttribute("class", "");
    }
  }
}
