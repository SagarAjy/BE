import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from './logger';

// Configure AWS SES
const sesClient = new SESClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Function to send an email
export const sendEmail = async ({ to, otp }: { to: string; otp: string }) => {
  // Define the email template content
  const subjectPart = `Your OTP for is: ${otp}`;
  const htmlPart = `
  <!doctype html>
<html lang="en-US">
  <head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <title>OTP</title>
    <meta name="description" content="">
    <style type="text/css">
      a:hover {
        text-decoration: underline !important;
      }
    </style>
  </head>
  <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
    <!-- 100% body table -->
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
      <tr>
        <td>
          <table style="background-color: #f2f3f8; max-width:670px; margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:80px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="text-align:center;">
                <a href="" title="logo" target="_blank">
                  <img width="auto" heigth="64px" src="${process.env.ORG_LOGO}" title="logo" alt="logo">
                </a>
              </td>
            </tr>
            <tr>
              <td style="height:20px;">&nbsp;</td>
            </tr>
            <tr>
              <td>
                <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px; background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                  <tr>
                    <td style="height:40px;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding:0 35px;">
                      <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Let's log you in!</h1>
                      <p style="font-size:15px; color:#455056; margin:8px 0 0; line-height:24px;"> Use this code to sign in for ${process.env.ORG_NAME} </p>
                      <p style="display:inline-block; font-weight:500; margin-top:24px;text-transform:uppercase; font-size:55px;">${otp}</p>
                      <p style="font-size:12px;">This code will sign you in using <span style="color: blue;"> ${to}</span></p>
                      <p style="font-size:10px; padding-top: 24px;">If you didn't request this email, you can safely ignore it.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="height:40px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="height:20px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="height:80px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  const textPart = `
Let's log you in!

Use this code to sign in for ${process.env.ORG_NAME}: ${otp}

This code will securely sign you up using ${to}

This code is valid for 5 minutes.

If you didn't request this email, you can safely ignore it.
`;

  // email params
  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlPart,
        },
        Text: {
          Charset: 'UTF-8',
          Data: textPart,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subjectPart,
      },
    },
    Source: `otp@${process.env.CLIENT_EMAIL}`,
  };

  // Create the CreateTemplateCommand
  const sendEmailCommand = new SendEmailCommand(params);

  // Function to create the email template
  await sesClient
    .send(sendEmailCommand)
    .then(res => null)
    .catch(err => logger.error(err));
};

// <tr>
//   <td style="text-align:center;">
//     <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">Powered by &copy; <strong>CredBrick</strong>
//     </p>
//   </td>
// </tr>
