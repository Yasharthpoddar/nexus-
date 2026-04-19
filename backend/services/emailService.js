const nodemailer = require('nodemailer');
require('dotenv').config();

// User Auth Need: Provide these inside .env to enable the system
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  auth: {
    user: process.env.EMAIL_USER || 'sample',
    pass: process.env.EMAIL_PASS || 'sample'
  }
});

function getEmailWrapper(content) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #fce7cf; padding: 40px; color: #121212;">
      <div style="max-w-md; margin: 0 auto; background: white; border: 4px solid #121212; padding: 40px; box-shadow: 8px 8px 0px 0px #121212;">
        <h1 style="text-transform: uppercase; letter-spacing: -1px; margin-top: 0;">NEXUS CLEARANCE SYSTEM</h1>
        <hr style="border-top: 4px solid #121212; margin: 20px 0;">
        ${content}
        <div style="margin-top: 40px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-top: 2px dashed #ccc; padding-top: 20px;">
          This is an automated message from the Nexus Administrative Protocol. Do not reply.
        </div>
      </div>
    </div>
  `;
}

async function sendNudgeEmail(toEmail, subject, data) {
  try {
    const html = getEmailWrapper(`
      <h2 style="color: #D02020; text-transform: uppercase;">Action Required: Pending Clearances</h2>
      <p style="font-size: 16px;">Hello,</p>
      <p style="font-size: 16px;">You currently have <strong>${data.pendingCount}</strong> applications awaiting your review that have been stalling for over 2 days.</p>
      <p style="font-size: 16px;">Please log in to the Nexus system at your earliest convenience to process them and prevent delays in student clearance.</p>
      <a href="http://localhost:5173/login" style="display: inline-block; background: #D02020; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase; margin-top: 20px; border: 2px solid #121212;">Log In to Nexus</a>
    `);

    await transporter.sendMail({
      from: '"Nexus System" <no-reply@nexus.college.edu>',
      to: toEmail,
      subject: `[ACTION REQUIRED] ${subject}`,
      html
    });
    return true;
  } catch (error) {
    console.error('Email nudge failed', error);
    return false;
  }
}

async function sendPaymentConfirmationEmail(toEmail, receiptNo, amount, department) {
  try {
    const html = getEmailWrapper(`
      <h2 style="color: #10A35A; text-transform: uppercase;">Payment Received</h2>
      <p style="font-size: 16px;">Your payment has been successfully processed.</p>
      <p style="font-size: 16px;"><strong>Amount:</strong> ₹${amount}</p>
      <p style="font-size: 16px;"><strong>Department:</strong> ${department}</p>
      <p style="font-size: 16px;"><strong>Receipt No:</strong> <span style="font-family: monospace;">${receiptNo}</span></p>
      <p style="font-size: 16px;">You can view and download this receipt in your Digital Locker.</p>
    `);

    await transporter.sendMail({
      from: '"Nexus Finance" <billing@nexus.college.edu>',
      to: toEmail,
      subject: `Payment Receipt ${receiptNo}`,
      html
    });
    return true;
  } catch (error) {
    console.error('Payment email failed', error);
    return false;
  }
}

async function sendCertificateReadyEmail(toEmail, certId) {
  try {
    const html = getEmailWrapper(`
      <h2 style="color: #F0C020; text-transform: uppercase;">Digital Certificate Ready</h2>
      <p style="font-size: 16px;">Congratulations! Your graduation clearance is fully complete.</p>
      <p style="font-size: 16px;">Your No-Dues Certificate has been generated and is ready to download.</p>
      <p style="font-size: 16px;"><strong>Certificate ID:</strong> <span style="font-family: monospace;">${certId}</span></p>
      <a href="http://localhost:5173/locker" style="display: inline-block; background: #F0C020; color: #121212; padding: 12px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase; margin-top: 20px; border: 2px solid #121212;">Open Digital Locker</a>
    `);

    await transporter.sendMail({
      from: '"Nexus Registrar" <registrar@nexus.college.edu>',
      to: toEmail,
      subject: `Your Clearance Certificate is Ready`,
      html
    });
    return true;
  } catch (error) {
    console.error('Certificate email failed', error);
    return false;
  }
}

async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('✓ Email service connected successfully');
  } catch (err) {
    console.warn('⚠ Email service not configured (check .env EMAIL_HOST/PORT/USER/PASS)');
  }
}

module.exports = {
  sendNudgeEmail,
  sendPaymentConfirmationEmail,
  sendCertificateReadyEmail,
  verifyEmailConnection
};
