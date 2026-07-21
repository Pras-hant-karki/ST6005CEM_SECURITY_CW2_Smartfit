// Static OpenAPI 3.0 definition: info, servers, tags, security schemes, and
// every reusable component schema. Endpoint paths themselves live as JSDoc
// @openapi blocks in the sibling *.docs.js files (see swagger.js), which
// swagger-jsdoc merges into this definition at startup. Nothing in this
// directory is imported by app.js's request pipeline — it only feeds the
// documentation build, so it can never affect runtime behavior.

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 8000;
const scheme = process.env.HTTPS_ENABLED === "true" ? "https" : "http";

// In production there's exactly one real way to reach this server. In dev,
// list both schemes explicitly (rather than just the one currently active)
// so the Swagger UI server dropdown still works if HTTPS_ENABLED is
// toggled without restarting the docs build — see Backend/certs/README.md.
const servers = isProduction
  ? [{ url: `${scheme}://localhost:${port}/api/v1`, description: "Current server" }]
  : [
      { url: `http://localhost:${port}/api/v1`, description: "Local development (HTTP)" },
      { url: `https://localhost:${port}/api/v1`, description: "Local development (HTTPS, self-signed cert)" },
    ];

export const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "SmartFit Hospital Management System API",
    version: "v1.0",
    description: `
Professional REST API documentation for the SmartFit Hospital Management System.

Documents authentication, authorization, appointments, payments, medical
records, reports, uploads, account management, and administrative
operations across the three SmartFit portals (Patient, Doctor, Admin), all
served by this single Express API.

## Authentication

The browser apps authenticate using **HttpOnly session cookies** set
automatically on login (\`accessToken\`/\`accesstoken\` + \`refreshToken\`/\`refreshtoken\`
— cookie casing differs slightly by role; see the Authentication tag). For
testing this API directly (Swagger "Try it out", Postman, curl), every
protected endpoint also accepts a standard \`Authorization: Bearer <token>\`
header carrying the same access token — use the **Authorize** button above
after logging in.

## Multi-Factor Authentication

All three roles require email-OTP verification after a correct password.
A successful \`POST /login\` never returns session tokens directly — it
returns \`{ mfaRequired: true }\` and emails a one-time code, which must be
submitted to the role's \`/login/verify-mfa\` endpoint to receive the actual
session.

## CSRF Protection

Every state-changing request (POST/PUT/PATCH/DELETE, except the excluded
internal endpoints) requires an \`X-CSRF-Token\` header matching the value of
the \`csrfToken\` cookie (double-submit pattern). The cookie is issued
automatically on first contact with the API. When testing "Try it out" from
this page for a mutating endpoint, read the \`csrfToken\` cookie value from
your browser and paste it into the CSRF token field in the Authorize dialog.

## Response Format

Successful responses follow \`{ statusCode, data, message, success: true }\`.
Error responses follow \`{ success: false, message, errors: [] }\` with the
HTTP status code carrying the actual error class (400/401/403/404/409/423/429/500/503).
See the **StandardSuccessResponse** / **StandardErrorResponse** schemas.

## Excluded from this documentation

A few endpoints are intentionally **not** documented here because they are
not part of the public API contract: the Stripe webhook receiver, the
internal cron trigger, the admin-only raw document file server, and the
admin security-monitoring dashboard. All four are internal-only,
non-interactive, and/or authenticated by mechanisms other than a normal
user session (Stripe signatures, a shared cron secret).
    `.trim(),
    contact: {
      name: "SmartFit Engineering",
    },
    license: {
      name: "UNLICENSED — academic coursework project",
    },
  },
  servers,
  tags: [
    { name: "Authentication", description: "Registration, login, MFA verification, logout, token renewal, and password recovery — for all three roles." },
    { name: "Patient", description: "Patient profile, self-service account management, and patient-facing doctor/department lookups." },
    { name: "Doctor", description: "Doctor profile, credential documents, and doctor self-service account management." },
    { name: "Admin", description: "Admin profile, doctor account management, and department management." },
    { name: "Appointment", description: "Booking, availability, rescheduling, cancellation, and verification of appointments." },
    { name: "Department", description: "Hospital department directory." },
    { name: "Prescription", description: "Prescriptions issued by doctors and viewed by patients/doctors." },
    { name: "Lab Test", description: "Lab test orders, results, and doctor verification." },
    { name: "Payment", description: "Stripe Checkout session creation and payment status verification." },
    { name: "Privacy", description: "GDPR-style data export (PDF) and account deletion, for all three roles." },
    { name: "System", description: "Service-level endpoints not tied to a specific business resource." },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Access token issued at login/MFA-verification. The browser apps carry this in an HttpOnly cookie automatically; API clients may instead send `Authorization: Bearer <accessToken>`.",
      },
      csrfToken: {
        type: "apiKey",
        in: "header",
        name: "X-CSRF-Token",
        description:
          "Required on every state-changing request (POST/PUT/PATCH/DELETE). Must match the `csrfToken` cookie value (double-submit pattern).",
      },
    },
    schemas: {
      // ---------------------------------------------------------------
      // Generic envelopes
      // ---------------------------------------------------------------
      StandardSuccessResponse: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          data: { type: "object", nullable: true },
          message: { type: "string", example: "Success" },
          success: { type: "boolean", example: true },
        },
      },
      StandardErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Something went wrong" },
          errors: { type: "array", items: {}, example: [] },
          stack: { type: "string", nullable: true, description: "Only present when NODE_ENV=development." },
        },
      },
      ValidationError: {
        allOf: [
          { $ref: "#/components/schemas/StandardErrorResponse" },
          {
            type: "object",
            properties: {
              message: { type: "string", example: "All fields are required" },
            },
          },
        ],
      },
      PaginationMeta: {
        type: "object",
        description:
          "Reserved for future use. No current list endpoint implements server-side pagination — every list endpoint documented here returns the complete result set for the caller's own scope (e.g. a patient's own appointments), not a paginated page of it.",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 0 },
        },
      },

      // ---------------------------------------------------------------
      // Authentication
      // ---------------------------------------------------------------
      MfaRequiredResponse: {
        description: "Returned by POST /login on correct credentials — an OTP has been emailed and no session has been issued yet.",
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { mfaRequired: { type: "boolean", example: true } } } } },
        ],
      },
      CaptchaRequiredResponse: {
        description: "Returned instead of proceeding once the adaptive CAPTCHA threshold (3 failed attempts) is reached.",
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { captchaRequired: { type: "boolean", example: true } } } } },
        ],
      },
      MfaVerifyRequest: {
        type: "object",
        required: ["otp"],
        properties: {
          otp: { type: "string", example: "482913", description: "6-digit code emailed to the account." },
        },
      },
      LoginSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { user: { type: "object", description: "The authenticated user's profile (password/refresh token stripped)." } } } } },
        ],
      },
      OtpSendResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { message: { type: "string", example: "OTP sent successfully" } } },
        ],
      },
      TokenRenewalResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { accesstoken: { type: "string" } } } } },
        ],
      },
      ForgotPasswordRequest: {
        type: "object",
        description: "Provide either email or phonenumber.",
        properties: {
          email: { type: "string", format: "email", example: "patient@example.com" },
          phonenumber: { type: "string", example: "9800000000" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["newpassword"],
        properties: {
          newpassword: { type: "string", format: "password", example: "NewStrongP@ssw0rd123" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["oldpassword", "newpassword"],
        properties: {
          oldpassword: { type: "string", format: "password" },
          newpassword: { type: "string", format: "password", example: "NewStrongP@ssw0rd123" },
        },
      },

      // ---------------------------------------------------------------
      // Patient
      // ---------------------------------------------------------------
      RegisterPatientRequest: {
        type: "object",
        required: ["patientname", "patientusername", "email", "password", "confirmPassword", "phonenumber", "age", "sex"],
        properties: {
          patientname: { type: "string", example: "Aayush Subedi" },
          patientusername: { type: "string", example: "aayush_s" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", description: "Min 12 chars, upper/lower/digit/special character required." },
          confirmPassword: { type: "string", format: "password" },
          phonenumber: { type: "string", example: "9800000000" },
          age: { type: "integer", example: 28 },
          sex: { type: "string", enum: ["Male", "Female", "Others"] },
          guardianName: { type: "string", nullable: true },
          profilepicture: { type: "string", format: "binary", description: "Optional. JPEG/PNG/WebP, max 5MB." },
        },
      },
      LoginPatientRequest: {
        type: "object",
        required: ["password"],
        description: "Provide either email or patientusername.",
        properties: {
          email: { type: "string", format: "email" },
          patientusername: { type: "string" },
          password: { type: "string", format: "password" },
          "h-captcha-response": { type: "string", description: "Required only once CAPTCHA is triggered (see CaptchaRequiredResponse)." },
        },
      },
      UpdatePatientProfileRequest: {
        type: "object",
        properties: {
          patientname: { type: "string" },
          email: { type: "string", format: "email" },
          phonenumber: { type: "string" },
          age: { type: "integer" },
          sex: { type: "string", enum: ["Male", "Female", "Others"] },
          guardianName: { type: "string" },
        },
      },
      PatientProfile: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64f0a1b2c3d4e5f678901234" },
          patientname: { type: "string" },
          patientusername: { type: "string" },
          email: { type: "string", format: "email" },
          phonenumber: { type: "string" },
          age: { type: "integer" },
          sex: { type: "string", enum: ["Male", "Female", "Others"] },
          guardianName: { type: "string" },
          profilepicture: { type: "string", format: "uri", nullable: true },
          isDeleted: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      // ---------------------------------------------------------------
      // Doctor
      // ---------------------------------------------------------------
      RegisterDoctorRequest: {
        type: "object",
        required: ["doctorname", "doctorusername", "email", "password", "consultationfee"],
        properties: {
          doctorname: { type: "string" },
          doctorusername: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          phonenumber: { type: "string" },
          sex: { type: "string", enum: ["Male", "Female", "Others"] },
          age: { type: "integer" },
          experience: { type: "integer" },
          qualification: { type: "string" },
          consultationfee: { type: "number" },
          department: { type: "string" },
          specialization: { type: "string" },
          shift: { type: "array", items: { $ref: "#/components/schemas/Shift" }, description: "JSON-encoded array when sent via multipart/form-data." },
          citizenshipdocument: { type: "string", format: "binary" },
          medicaldegree: { type: "string", format: "binary" },
          medicallicense: { type: "string", format: "binary" },
          profilepicture: { type: "string", format: "binary" },
        },
        description: "New doctor accounts require admin approval (isApproved) before appearing in public doctor listings — pending approval doesn't block login/MFA.",
      },
      Shift: {
        type: "object",
        required: ["day", "starttime", "endtime", "patientslot"],
        properties: {
          day: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
          starttime: { type: "string", example: "09:00" },
          endtime: { type: "string", example: "17:00" },
          patientslot: { type: "integer", example: 30, description: "Minutes per appointment slot." },
        },
      },
      LoginDoctorRequest: {
        type: "object",
        required: ["password"],
        description: "Provide either email or doctorusername.",
        properties: {
          email: { type: "string", format: "email" },
          doctorusername: { type: "string" },
          password: { type: "string", format: "password" },
          "h-captcha-response": { type: "string" },
        },
      },
      UpdateDoctorProfileRequest: {
        type: "object",
        required: ["phonenumber", "age", "sex", "experience", "qualification", "department", "shift"],
        properties: {
          phonenumber: { type: "string" },
          age: { type: "integer" },
          sex: { type: "string", enum: ["Male", "Female", "Others"] },
          experience: { type: "integer" },
          qualification: { type: "string" },
          department: { type: "string" },
          specialization: { type: "string" },
          shift: { type: "array", items: { $ref: "#/components/schemas/Shift" } },
        },
        description: "doctorname, email, and consultationfee are admin-managed and not editable here.",
      },
      UpdateDoctorDocumentsRequest: {
        type: "object",
        description: "At least one file is required.",
        properties: {
          citizenshipdocument: { type: "string", format: "binary" },
          medicaldegree: { type: "string", format: "binary" },
          medicallicense: { type: "string", format: "binary" },
        },
      },
      DoctorProfile: {
        type: "object",
        properties: {
          _id: { type: "string" },
          doctorname: { type: "string" },
          doctorusername: { type: "string" },
          email: { type: "string", format: "email" },
          phonenumber: { type: "string" },
          sex: { type: "string", enum: ["Male", "Female", "Others", ""] },
          age: { type: "integer" },
          experience: { type: "integer" },
          qualification: { type: "string" },
          consultationfee: { type: "number" },
          department: { type: "string" },
          specialization: { type: "string" },
          shift: { type: "array", items: { $ref: "#/components/schemas/Shift" } },
          isApproved: { type: "boolean" },
          verificationdocument: {
            type: "object",
            properties: {
              citizenshipdocument: { type: "string", format: "uri" },
              medicaldegree: { type: "string", format: "uri" },
              medicallicense: { type: "string", format: "uri" },
              profilepicture: { type: "string", format: "uri" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      // ---------------------------------------------------------------
      // Admin
      // ---------------------------------------------------------------
      RegisterAdminRequest: {
        type: "object",
        required: ["adminname", "adminusername", "email", "password", "phonenumber", "citizenshipdocument", "adminId", "profilepicture", "appointmentletter"],
        description: "Requires an existing authenticated admin (self-registration is not possible).",
        properties: {
          adminname: { type: "string" },
          adminusername: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          phonenumber: { type: "string" },
          citizenshipdocument: { type: "string", format: "binary" },
          adminId: { type: "string", format: "binary" },
          profilepicture: { type: "string", format: "binary" },
          appointmentletter: { type: "string", format: "binary" },
        },
      },
      LoginAdminRequest: {
        type: "object",
        required: ["password"],
        description: "Provide either email or adminusername.",
        properties: {
          adminusername: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          "h-captcha-response": { type: "string" },
        },
      },
      UpdateAdminProfileRequest: {
        type: "object",
        properties: {
          adminname: { type: "string" },
          email: { type: "string", format: "email" },
          phonenumber: { type: "string" },
        },
      },
      AdminProfile: {
        type: "object",
        properties: {
          _id: { type: "string" },
          adminname: { type: "string" },
          adminusername: { type: "string" },
          email: { type: "string", format: "email" },
          phonenumber: { type: "string" },
          verificationdocs: {
            type: "object",
            properties: {
              citizenshipdocument: { type: "string", format: "uri" },
              adminId: { type: "string", format: "uri" },
              profilepicture: { type: "string", format: "uri" },
              appointmentletter: { type: "string", format: "uri" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      // ---------------------------------------------------------------
      // Appointment
      // ---------------------------------------------------------------
      Appointment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          appointmentdate: { type: "string", format: "date-time" },
          appointmenttime: { type: "string", example: "10:30" },
          symptoms: { type: "string" },
          medicalhistory: { type: "string" },
          status: { type: "string", enum: ["Pending", "Confirmed", "Cancelled", "Completed"] },
          uniquecode: { type: "string", description: "Presented by the patient and checked by the doctor to verify arrival." },
          patientdetails: { type: "object", description: "Populated patient summary (name, username, age, sex, phone, email)." },
          doctordetails: { type: "object", description: "Populated doctor summary (name, username, department, specialization, qualification, fee)." },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateAppointmentRequest: {
        type: "object",
        required: ["appointmentdate", "appointmenttime"],
        properties: {
          appointmentdate: { type: "string", format: "date", example: "2026-08-01" },
          appointmenttime: { type: "string", example: "10:30", description: "Must match one of the doctor's available slots for that day." },
          symptoms: { type: "string" },
          medicalhistory: { type: "string", nullable: true },
        },
      },
      UpdateAppointmentRequest: {
        type: "object",
        properties: {
          appointmentdate: { type: "string", format: "date" },
          appointmenttime: { type: "string" },
          symptoms: { type: "string" },
          medicalhistory: { type: "string" },
        },
      },
      AvailabilityDay: {
        type: "object",
        properties: {
          date: { type: "string", format: "date" },
          isAvailable: { type: "boolean" },
          availableTimes: { type: "array", items: { type: "string" }, example: ["09:00", "09:30", "10:00"] },
        },
      },

      // ---------------------------------------------------------------
      // Department
      // ---------------------------------------------------------------
      Department: {
        type: "object",
        properties: {
          _id: { type: "string" },
          deptname: { type: "string", example: "cardiology" },
          description: { type: "string" },
          iconKey: { type: "string", example: "hospital" },
          color: { type: "string", example: "general-green" },
        },
      },
      CreateDepartmentRequest: {
        type: "object",
        required: ["deptname", "description"],
        properties: {
          deptname: { type: "string" },
          description: { type: "string" },
          iconKey: { type: "string" },
          color: { type: "string" },
        },
      },
      UpdateDepartmentRequest: {
        type: "object",
        description: "At least one field is required.",
        properties: {
          deptname: { type: "string" },
          description: { type: "string" },
          iconKey: { type: "string" },
          color: { type: "string" },
        },
      },

      // ---------------------------------------------------------------
      // Prescription
      // ---------------------------------------------------------------
      Medicine: {
        type: "object",
        required: ["medicinename", "dosage", "frequency", "duration"],
        properties: {
          medicinename: { type: "string", example: "Amoxicillin" },
          dosage: { type: "string", example: "500mg" },
          frequency: { type: "string", example: "Twice daily" },
          duration: { type: "string", example: "7 days" },
        },
      },
      Prescription: {
        type: "object",
        properties: {
          _id: { type: "string" },
          appointmentid: { type: "string" },
          doctordetails: { type: "object", description: "Snapshot of the issuing doctor at time of creation." },
          patientdetails: { type: "object", description: "Snapshot of the patient at time of creation." },
          diagonosis: { type: "string" },
          medicines: { type: "array", items: { $ref: "#/components/schemas/Medicine" } },
          labtest: { type: "string", nullable: true, description: "Linked lab test ID, if one was ordered." },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreatePrescriptionRequest: {
        type: "object",
        required: ["diagonosis", "medicines"],
        description: "Can only be created for an appointment with status Completed, and only by the doctor who held it.",
        properties: {
          diagonosis: { type: "string" },
          medicines: { type: "array", items: { $ref: "#/components/schemas/Medicine" }, minItems: 1 },
          labtest: { type: "string", nullable: true },
        },
      },
      UpdatePrescriptionRequest: {
        type: "object",
        description: "At least one field is required.",
        properties: {
          diagonosis: { type: "string" },
          medicines: { type: "array", items: { $ref: "#/components/schemas/Medicine" } },
          labtest: { type: "string", nullable: true },
        },
      },

      // ---------------------------------------------------------------
      // Lab Test
      // ---------------------------------------------------------------
      TestParameter: {
        type: "object",
        properties: {
          name: { type: "string", example: "Hemoglobin" },
          value: { type: "string", example: "13.5" },
          unit: { type: "string", example: "g/dL" },
          reference_range: { type: "string", example: "13.0–17.0" },
          status: { type: "string", enum: ["Normal", "Low", "High", "Abnormal"] },
        },
      },
      LabTestEntry: {
        type: "object",
        required: ["test_name"],
        properties: {
          test_name: { type: "string", example: "Complete Blood Count" },
          parameters: { type: "array", items: { $ref: "#/components/schemas/TestParameter" } },
          result_summary: { type: "string" },
          remarks: { type: "string" },
          status: { type: "string", enum: ["ordered", "processing", "completed"], default: "ordered" },
        },
      },
      LabTest: {
        type: "object",
        properties: {
          _id: { type: "string" },
          prescription_id: { type: "string" },
          patient_id: { type: "string" },
          doctor_id: { type: "string" },
          tests: { type: "array", items: { $ref: "#/components/schemas/LabTestEntry" } },
          overall_status: { type: "string", enum: ["ordered", "processing", "completed"] },
          report_date: { type: "string", format: "date-time", nullable: true },
          attachments: { type: "array", items: { type: "object", properties: { file_name: { type: "string" }, file_url: { type: "string", format: "uri" } } } },
          verified_by: { type: "string", nullable: true, description: "Doctor ID once verified." },
          verified_at: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateLabTestRequest: {
        type: "object",
        required: ["prescription_id", "tests"],
        description: "patient_id is derived server-side from the prescription — never accepted from the client. The requesting doctor must own the prescription.",
        properties: {
          prescription_id: { type: "string" },
          tests: { type: "array", items: { $ref: "#/components/schemas/LabTestEntry" }, minItems: 1 },
          attachments: { type: "array", items: { type: "object", properties: { file_name: { type: "string" }, file_url: { type: "string" } } } },
        },
      },
      UpdateLabTestRequest: {
        type: "object",
        description: "At least one field is required.",
        properties: {
          tests: { type: "array", items: { $ref: "#/components/schemas/LabTestEntry" } },
          overall_status: { type: "string", enum: ["ordered", "processing", "completed"] },
          report_date: { type: "string", format: "date-time", nullable: true },
          attachments: { type: "array", items: { type: "object" } },
        },
      },
      UpdateTestResultsRequest: {
        type: "object",
        required: ["test_index"],
        properties: {
          test_index: { type: "integer", example: 0, description: "Index into the lab test's `tests` array." },
          parameters: { type: "array", items: { $ref: "#/components/schemas/TestParameter" } },
          result_summary: { type: "string" },
          remarks: { type: "string" },
          status: { type: "string", enum: ["ordered", "processing", "completed"] },
        },
      },
      VerifyAppointmentRequest: {
        type: "object",
        required: ["appointmentid", "uniquecode"],
        properties: {
          appointmentid: { type: "string" },
          uniquecode: { type: "string", description: "Code shown to the patient at booking; matched exactly against the stored value." },
        },
      },

      // ---------------------------------------------------------------
      // Payment
      // ---------------------------------------------------------------
      CreateCheckoutSessionRequest: {
        type: "object",
        required: ["appointmentId"],
        properties: {
          appointmentId: { type: "string", description: "Must belong to the authenticated patient and not already be paid or cancelled." },
        },
      },
      CheckoutSessionResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          {
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri", description: "Stripe-hosted Checkout page — redirect the browser here." },
                  sessionId: { type: "string" },
                },
              },
            },
          },
        ],
      },
      PaymentStatusResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          {
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["pending", "completed", "failed", "expired"] },
                  amount: { type: "integer", description: "Smallest currency unit (pence)." },
                  currency: { type: "string", example: "gbp" },
                  appointmentId: { type: "string" },
                  processedAt: { type: "string", format: "date-time", nullable: true },
                },
              },
            },
          },
        ],
      },

      // ---------------------------------------------------------------
      // Privacy (Export / Delete)
      // ---------------------------------------------------------------
      DeleteAccountSendOtpResponse: { $ref: "#/components/schemas/OtpSendResponse" },
      DeleteAccountRequest: {
        type: "object",
        required: ["password", "otp"],
        properties: {
          password: { type: "string", format: "password", description: "Current account password." },
          otp: { type: "string", description: "Code obtained from the delete-account send-otp endpoint." },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing, invalid, or expired credentials.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/StandardErrorResponse" }, example: { success: false, message: "Unauthorized request", errors: [] } } },
      },
      Forbidden: {
        description: "Authenticated, but not permitted to access/modify this resource (wrong role, or not the owner).",
        content: { "application/json": { schema: { $ref: "#/components/schemas/StandardErrorResponse" }, example: { success: false, message: "Access denied", errors: [] } } },
      },
      NotFound: {
        description: "The requested resource does not exist.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/StandardErrorResponse" }, example: { success: false, message: "Not found", errors: [] } } },
      },
      ValidationFailed: {
        description: "Request body failed validation.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } },
      },
      Conflict: {
        description: "The request conflicts with existing state (duplicate slot, already exists, already paid, etc.).",
        content: { "application/json": { schema: { $ref: "#/components/schemas/StandardErrorResponse" } } },
      },
      TooManyRequests: {
        description: "Rate limit exceeded for this endpoint.",
        content: { "application/json": { schema: { type: "object", properties: { statusCode: { type: "integer", example: 429 }, message: { type: "string" } } } } },
      },
      CsrfRejected: {
        description: "Missing or mismatched X-CSRF-Token header.",
        content: { "application/json": { schema: { type: "object", properties: { statusCode: { type: "integer", example: 403 }, message: { type: "string", example: "Invalid or missing CSRF token" } } } } },
      },
    },
  },
};

export default swaggerDefinition;
