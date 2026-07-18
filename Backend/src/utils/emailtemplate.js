// Prevent HTML injection in email bodies from user-controlled fields.
const escapeHtml = (str) =>
    String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");

const otpTemplate = (otp) => `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 30px;">
      <h2 style="text-align: center; color: #4CAF50;">SmartFit OTP Verification</h2>
      <p>Dear user,</p>
      <p>Your One-Time Password (OTP) is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; letter-spacing: 4px; font-weight: bold; background: #eee; padding: 10px 20px; border-radius: 5px;">
          ${otp}
        </span>
      </div>
      <p>This OTP is valid for 5 minutes. If you didn’t request it, please ignore this email.</p>
      <p style="margin-top: 30px;">— SmartFit HMS Team</p>
    </div>
  </div>
`;

const forgetpasswordotptemplate = (otp, greeting = "Hi") => `
  <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Reset Your Password - OTP Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
        color: #333;
        padding: 20px;
      }
      .container {
        max-width: 500px;
        margin: auto;
        background: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .otp {
        font-size: 24px;
        font-weight: bold;
        color: #1a73e8;
        letter-spacing: 4px;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #777;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Password Reset Request</h2>
      <p>${escapeHtml(greeting)},</p>
      <p>You requested to reset your password. Please use the OTP below to proceed:</p>
      <p class="otp">${otp}</p>
      <p>This OTP will expire in 5 minutes for your security. If you did not request this, please ignore this email.</p>
      <p>Thank you,<br />SmartFit Team</p>
      <div class="footer">
        This is an automated email. Please do not reply.
      </div>
    </div>
  </body>
</html>
`
const welcomeemailtemplate = (username,) => `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to SmartFit</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f7fa;
      margin: 0;
      padding: 0;
    }

    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .header {
      background-color: #2a9d8f;
      color: #ffffff;
      text-align: center;
      padding: 30px 20px;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
    }

    .content {
      padding: 30px 20px;
      color: #333333;
    }

    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin: 15px 0;
    }

    .cta-button {
      display: inline-block;
      margin-top: 20px;
      background-color: #264653;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
    }

    .footer {
      text-align: center;
      font-size: 14px;
      color: #a0aec0;
      padding: 20px;
      background-color: #f1f5f9;
    }
  </style>
</head>
<body>

  <div class="email-container">
    <div class="header">
      <h1>Welcome to SmartFit, ${username}!</h1>
    </div>

    <div class="content">
      <p>Hi ${escapeHtml(username)},</p>
      <p>We're excited to have you onboard! Your account has been successfully created.</p>
      <p>You can now access your personalized dashboard, book appointments, manage records, and much more.</p>
      <p>If you didn't register for a SmartFit account, please ignore this message or contact our support team immediately.</p>
    </div>

    <div class="footer">
      &copy; 2025 SmartFit. All rights reserved.
    </div>
  </div>

</body>
</html>

`
const logintemplate = (username) => `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SmartFit Login Alert</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f7fa;
      margin: 0;
      padding: 0;
    }

    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .header {
      background-color: #2a9d8f;
      color: #ffffff;
      text-align: center;
      padding: 30px 20px;
    }

    .header h1 {
      margin: 0;
      font-size: 22px;
    }

    .content {
      padding: 30px 20px;
      color: #333333;
    }

    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin: 15px 0;
    }

    .footer {
      text-align: center;
      font-size: 14px;
      color: #a0aec0;
      padding: 20px;
      background-color: #f1f5f9;
    }
    .details-box p {
      margin: 8px 0;
      font-size: 15px;
    }
  </style>
</head>
<body>

  <div class="email-container">
    <div class="header">
      <h1>Login Successful</h1>
    </div>

    <div class="content">
      <p>Hi ${escapeHtml(username)},</p>
      <p>Your SmartFit account was successfully accessed.</p>

      <p>If this was you, no further action is needed.</p>
      <p>If you did not initiate this login, please reset your password immediately or contact SmartFit Support.</p>
    </div>

    <div class="footer">
      &copy; 2025 SmartFit. All rights reserved.
    </div>
  </div>

</body>
</html>

`
const appointmentconfirmation = (_otpCode,patientName,doctorName,department,appointmentDate,appointmentTime) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Appointment Confirmation</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f7f9fc;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
      }

      .email-container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        padding: 40px;
      }

      .header {
        border-bottom: 1px solid #e0e6ed;
        margin-bottom: 24px;
      }

      .header h1 {
        font-size: 22px;
        color: #2c3e50;
        margin: 0;
      }

      .section {
        margin-bottom: 24px;
      }

      .section p {
        font-size: 16px;
        margin: 6px 0;
      }

      .footer {
        font-size: 12px;
        color: #888;
        border-top: 1px solid #e0e6ed;
        padding-top: 16px;
        margin-top: 24px;
        text-align: center;
      }

      .highlight {
        font-weight: 600;
        color: #000;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>Appointment Confirmation</h1>
      </div>

      <div class="section">
        <p>Dear <span class="highlight">${escapeHtml(patientName)}</span>,</p>
        <p>
          Your appointment with <strong>Dr. ${escapeHtml(doctorName)}</strong> has been
          successfully confirmed.
        </p>
      </div>

      <div class="section">
        <p><strong>Appointment Details:</strong></p>
        <p>Date: <span class="highlight">${escapeHtml(String(appointmentDate))}</span></p>
        <p>Time: <span class="highlight">${escapeHtml(appointmentTime)}</span></p>
        <p>Department: <span class="highlight">${escapeHtml(department)}</span></p>
        <p>Hospital: <span class="highlight">SmartFit Hospital</span></p>
      </div>

      <div class="section">
        <p>
          Your appointment check-in code is available inside your SmartFit
          patient dashboard. Please log in and open appointment details when
          you arrive at the hospital.
        </p>
        <p>
          If you have any questions or need to reschedule, please contact our
          helpdesk at <a>support@SmartFit</a> or call
          <strong>1800-563-2316</strong>.
        </p>
      </div>

      <div class="footer">
        <p>
          This is an automated message from SmartFit. Please do not
          reply directly to this email.
        </p>
        <p>Thank you for choosing <strong>SmartFit</strong>.</p>

        <p>&copy; 2025 SmartFit. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`
const appointmentcancellation=(patientName,doctorName,appointmentDate,appointmentTime)=>`
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background-color: #f7f9fc;
        padding: 20px;
        color: #333;
      }
      .container {
        background-color: #fff;
        padding: 24px;
        border-radius: 8px;
        max-width: 600px;
        margin: auto;
        box-shadow: 0 0 6px rgba(0,0,0,0.05);
      }
      .footer {
        font-size: 12px;
        color: #888;
        margin-top: 24px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2> Appointment Cancelled</h2>
      <p>Dear ${escapeHtml(patientName)},</p>

      <p>Your appointment with <strong>Dr. ${escapeHtml(doctorName)}</strong> on <strong>${escapeHtml(String(appointmentDate))}</strong> at <strong>${escapeHtml(appointmentTime)}</strong> has been <strong>cancelled</strong>.</p>

      <p>If this was a mistake or you'd like to reschedule, please contact us at <strong>support@SmartFit</strong> or call <strong>1800-563-2316</strong>.</p>

      <p>We hope to assist you again soon.</p>

      <div class="footer">
        &copy; 2025 SmartFit. All rights reserved.
      </div>
    </div>
  </body>
</html>

`
const appointmentupdation = (patientName,doctorName,appointmentDate,appointmentTime)=>`
 <!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background-color: #f7f9fc;
        padding: 20px;
        color: #333;
      }
      .container {
        background-color: #fff;
        padding: 24px;
        border-radius: 8px;
        max-width: 600px;
        margin: auto;
        box-shadow: 0 0 6px rgba(0,0,0,0.05);
      }
      .footer {
        font-size: 12px;
        color: #888;
        margin-top: 24px;
        text-align: center;
      }
      .details {
        margin: 20px 0;
        padding: 16px;
        background-color: #f1f5f9;
        border-radius: 6px;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Appointment Updated</h2>
      <p>Dear ${escapeHtml(patientName)},</p>

      <p>Your appointment has been <strong>updated</strong>. Please find the revised details below:</p>

      <div class="details">
        <p><strong>Doctor:</strong> Dr. ${escapeHtml(doctorName)} </p>
        <p><strong>Date:</strong> ${escapeHtml(String(appointmentDate))}</p>
        <p><strong>Time:</strong> ${escapeHtml(appointmentTime)}</p>
      </div>

      <p>If you have any questions or need further assistance, feel free to contact us at <strong>support@SmartFit</strong> or call <strong>1800-563-2316</strong>.</p>

      <p>Thank you for choosing <strong>SmartFit</strong>.</p>

      <div class="footer">
        &copy; 2025 SmartFit. All rights reserved.
      </div>
    </div>
  </body>
</html>


`

export { otpTemplate, forgetpasswordotptemplate, welcomeemailtemplate, logintemplate ,appointmentconfirmation,appointmentcancellation,appointmentupdation} 
