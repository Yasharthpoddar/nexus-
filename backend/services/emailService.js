const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'sample',
    pass: process.env.SMTP_PASS || 'sample'
  }
});

async function sendNudgeEmail(toEmail, subject, bodyLine) {
  try {
    await transporter.sendMail({
      from: '"Nexus System" <no-reply@nexus.college.edu>',
      to: toEmail,
      subject: `[Nudge] ${subject}`,
      text: `${bodyLine}\n\nPlease log in to Nexus to take action.\n\n- Nexus Auto-Mailer`
    });
    return true;
  } catch (error) {
    console.error('Email nudge failed', error);
    return false;
  }
}

module.exports = { sendNudgeEmail };
