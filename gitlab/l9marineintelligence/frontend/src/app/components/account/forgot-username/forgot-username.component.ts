import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { MessageService } from "../../shared/message.service";
import { ServiceService } from "../../shared/service.service";

@Component({
  selector: "app-forgot-username",
  templateUrl: "./forgot-username.component.html",
  styleUrls: ["./forgot-username.component.scss"],
})
export class ForgotUsernameComponent implements OnInit {
  // Flag to control whether to display the username retrieval form or success message
  sendforgotusernmaerequest = "true";

  // Flag to track whether the forgot username form has been submitted
  forgotusernameFormSubmitted = false;

  // Array to store security questions
  securityquestions = [];

  // Variable to store the selected security question
  selectedSecurityQuestion!: string;

  // Constructor to inject necessary services
  constructor(
    private service: ServiceService,
    private msgservice: MessageService
  ) {}

  // Reactive form group for the forgot username functionality
  forgotusernameForm = new FormGroup({
    name: new FormControl("", [
      Validators.required,
      Validators.pattern(/[a-zA-Z0-9-_]/),
    ]),

    email: new FormControl("", [Validators.required, Validators.email]),

    quest: new FormControl(""),

    ans: new FormControl("", [Validators.required]),
  });

  // Getter for easy access to form controls
  get fu(): any {
    return this.forgotusernameForm.controls;
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

  // Function to initiate the username retrieval process
  forgotUsername() {
    // Set the form submission flag to true
    this.forgotusernameFormSubmitted = true;

    // Manually set an error if security question is not selected
    if (this.forgotusernameForm.value.quest === "") {
      this.forgotusernameForm.controls.quest.setErrors({
        required: true,
      });
    }

    // Exit if the form is invalid
    if (this.forgotusernameForm.invalid) {
      return;
    }

    // Call the service to request a username retrieval
    this.service.forgotUserName(this.forgotusernameForm.value).subscribe(
      (data: any) => {
        // Check if the username retrieval request was successful
        if (data.status === "success") {
          // Set the flag to display the success message
          this.sendforgotusernmaerequest = "false";
        }
      },
      (error: any) => {
        // Display error message using the message service
        this.msgservice.postErrorFunc(error);
      }
    );
  }
}
