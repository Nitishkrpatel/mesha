import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { MessageService } from "../../shared/message.service";
import { ServiceService } from "../../shared/service.service";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit {
  // Flag to track whether the registration form has been submitted
  registerformsubmitted = false;

  // Array to store security questions
  securityquestions = [];

  // Flag to control whether to display the new user registration form or success message
  sendnewrequest = "true";

  // Icon for password visibility toggle
  pwdicon = "grey-visibility_off";

  // Variable to store the selected security question
  selectedSecurityQuestion!: string;

  // Constructor to inject necessary services
  constructor(
    private service: ServiceService,
    private msgservice: MessageService
  ) {}

  // Reactive form group for the new user registration
  registrationForm = new FormGroup({
    fullname: new FormControl("", [
      Validators.required,
      Validators.pattern(/[a-zA-Z0-9-_]/),
    ]),
    email: new FormControl("", [Validators.required, Validators.email]),
    mobile: new FormControl("", [
      Validators.required,
      Validators.minLength(10),
      Validators.pattern("^((//+91-?)|0)?[0-9]{10}$"),
    ]),
    username: new FormControl("", [
      Validators.required,
      Validators.pattern(/[a-zA-Z0-9-_]/),
    ]),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(6),
    ]),
    securityquestion: new FormControl(""),
    securityanswer: new FormControl("", [Validators.required]),
  });

  // Getter for easy access to form controls
  get r(): any {
    return this.registrationForm.controls;
  }

  // Lifecycle hook - executes when the component is initialized
  ngOnInit(): void {
    // Fetch all security questions when the component is initialized
    this.getAllSecurityQuestion();
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

  // Restrict users to enter only numbers for mobile
  onlyNumberKey(event: { charCode: number }): any {
    return event.charCode === 8 || event.charCode === 0
      ? null
      : event.charCode >= 48 && event.charCode <= 57;
  }

  // Check if the username or email is already registered
  checkUserIdOrEmailId(data: any): void {
    let is_email: any;
    let text: any;

    if (data === "email") {
      is_email = "1";
      text = this.registrationForm.value.email;
    } else if (data === "username") {
      is_email = "0";
      text = this.registrationForm.value.username;
    }

    const reqData = {
      is_email: is_email,
      text: text,
    };

    this.service.checkUserIdOrEmailId(reqData).subscribe(
      (result: { status: string }) => {
        if (result.status === "success") {
          // Handle the case where the username or email is not duplicate
        }
      },
      (error: { error: any }) => {
        this.msgservice.postErrorFunc(error);
        if (error.error.status === "failure" && is_email === "1") {
          this.registrationForm.controls.email.setErrors({ duplicate: true });
        } else if (error.error.status === "failure" && is_email === "0") {
          this.registrationForm.controls.username.setErrors({
            duplicate: true,
          });
        }
      }
    );
  }

  // Function to initiate the new user registration process
  registerNewUser(): void {
    // Set the form submission flag to true
    this.registerformsubmitted = true;

    // Exit if the form is invalid
    if (this.registrationForm.invalid) {
      return;
    }

    // Prepare data for the new user registration
    const reqData = {
      name: this.registrationForm.value.fullname,
      email: this.registrationForm.value.email,
      mobile: this.registrationForm.value.mobile,
      user_name: this.registrationForm.value.username,
      password: this.registrationForm.value.password,
      security_quest: this.selectedSecurityQuestion,
      sq_answer: this.registrationForm.value.securityanswer,
    };

    // Call the service to register the new user
    this.service.userRegister(reqData).subscribe({
      next: (data) => {
        if (data.status === "success") {
          // Set the flag to display the success message
          this.sendnewrequest = "false";
        }
      },
      error: (error) => {
        // Display error message using the message service
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // To toggle type of input (password) to text or password
  showPassword(): void {
    const inputType = document.getElementById("password")!.getAttribute("type");
    if (inputType === "password") {
      document.getElementById("password")!.setAttribute("type", "text");
      this.pwdicon = "visibility";
    } else if (inputType === "text") {
      document.getElementById("password")!.setAttribute("type", "password");
      this.pwdicon = "grey-visibility_off";
    }
  }

  // Function to fetch all security questions
  getAllSecurityQuestion(): void {
    // Call the service to get all security questions
    this.service.getAllSecurityQuestions().subscribe({
      next: (result: { status: string; data: never[] }) => {
        // Check if the retrieval was successful
        if (result.status === "success") {
          // Populate the security questions array
          this.securityquestions = result.data;
        }
      },
      error: (error: any) => {
        // Display error message using the message service
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  // Function to get the selected security question based on its ID
  getSelectedSecurityQuestion(id: number): void {
    // Set the selected security question based on its ID
    this.selectedSecurityQuestion = this.securityquestions[id];
  }
}
