import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { MessageService } from "../../shared/message.service";
import { ServiceService } from "../../shared/service.service";

@Component({
  selector: "app-forgot-password",
  templateUrl: "./forgot-password.component.html",
  styleUrls: ["./forgot-password.component.scss"],
})
export class ForgotPasswordComponent implements OnInit {
  // Flag to control whether to display the password reset form or success message
  sendfpwdrequest = "true";

  // Flag to track whether the forgot password form has been submitted
  forgotpasswordsubmitted = false;

  // Array to store security questions
  securityquestions = [];

  // Variable to store the selected security question
  selectedSecurityQuestion!: string;

  // Constructor to inject necessary services
  constructor(
    private service: ServiceService,
    private msgservice: MessageService
  ) {}

  // Reactive form group for the forgot password functionality
  forgotpasswordForm = new FormGroup({
    username: new FormControl("", [
      Validators.required,
      Validators.pattern(/[a-zA-Z0-9-_]/),
    ]),

    securityQuestion: new FormControl(""),

    securityAnswer: new FormControl("", [Validators.required]),
  });

  // Getter for easy access to form controls
  get f(): any {
    return this.forgotpasswordForm.controls;
  }

  // Lifecycle hook - executes when the component is initialized
  ngOnInit(): void {
    // Fetch all security questions when the component is initialized
    this.getAllSecurityQuestion();
  }

  // Function to initiate the password reset process
  forgotPassword(): void {
    // Set the form submission flag to true
    this.forgotpasswordsubmitted = true;

    // Manually set an error if security question is not selected
    if (this.forgotpasswordForm.value.securityQuestion === "") {
      this.forgotpasswordForm.controls.securityQuestion.setErrors({
        required: true,
      });
    }

    // Exit if the form is invalid
    if (this.forgotpasswordForm.invalid) {
      return;
    }

    // Call the service to request a password reset
    this.service.forgotUserPassword(this.forgotpasswordForm.value).subscribe({
      next: (result: any) => {
        // Check if the password reset request was successful
        if (result.status === "success") {
          // Set the flag to display the success message
          this.sendfpwdrequest = "false";
        }
      },
      error: (error: any) => {
        // Display error message using the message service
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // Function to fetch all security questions
  getAllSecurityQuestion(): any {
    // Call the service to get all security questions
    this.service.getAllSecurityQuestions().subscribe({
      next: (result: any) => {
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
