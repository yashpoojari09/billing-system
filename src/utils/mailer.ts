// utils/mailer.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // your email
    pass: process.env.EMAIL_PASS, // app password, not your Gmail login!
  },
});

export const sendMail = async (options: {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}) => {
  await transporter.sendMail({
    from: `"Your Company" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
};
