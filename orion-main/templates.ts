import { format } from 'date-fns';
import { formatIndianNumber } from './utils';

export const sanctionLetterHTMLContent = ({
  logoUrl,
  customerName,
  applicationId,
  approvalDate,
  approvalAmount,
  roi,
  processingFees,
  gstAmount,
  totalDeductions,
  disbursalAmount,
  repayDate,
  repayAmount,
  clientName,
  clientNbfc,
}: {
  logoUrl: string;
  customerName: string;
  applicationId: string;
  approvalDate: Date;
  approvalAmount: number;
  roi: number;
  processingFees: number;
  gstAmount: number;
  totalDeductions: number;
  disbursalAmount: number;
  repayDate: Date;
  repayAmount: number;
  clientName: string;
  clientNbfc: string;
}) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1" />
        <!--[if !mso]>
            <!-->
        <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
        <!--
            <![endif]-->
        <!--[if (gte mso 9)|(IE)]>
            <xml>
                <o:OfficeDocumentSettings>
                    <o:AllowPNG />
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
            </xml>
            <![endif]-->
        <!--[if (gte mso 9)|(IE)]>
            <style type='text/css'>
            body {
              width: 600px;
              margin: 0 auto;
            }
        
            table {
              border-collapse: collapse;
            }
        
            table,
            td {
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
        
            img {
              -ms-interpolation-mode: bicubic;
            }
          </style>
            <![endif]-->
        <style type="text/css">
          body,
          p,
          div {
            font-family: verdana, geneva, sans-serif;
            font-size: 16px;
          }
    
          body {
            color: #516775;
          }
    
          body a {
            color: #516775;
            text-decoration: none;
          }
    
          p {
            margin: 0;
            padding: 0;
          }
    
          table.wrapper {
            width: 100% !important;
            table-layout: fixed;
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: 100%;
            -moz-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
    
          img.max-width {
            max-width: 100% !important;
          }
    
          .column.of-2 {
            width: 50%;
          }
    
          .column.of-3 {
            width: 33.333%;
          }
    
          .column.of-4 {
            width: 25%;
          }
    
          @media screen and (max-width: 480px) {
    
            .preheader .rightColumnContent,
            .footer .rightColumnContent {
              text-align: left !important;
            }
    
            .preheader .rightColumnContent div,
            .preheader .rightColumnContent span,
            .footer .rightColumnContent div,
            .footer .rightColumnContent span {
              text-align: left !important;
            }
    
            .preheader .rightColumnContent,
            .preheader .leftColumnContent {
              font-size: 80% !important;
              padding: 5px 0;
            }
    
            table.wrapper-mobile {
              width: 100% !important;
              table-layout: fixed;
            }
    
            img.max-width {
              height: auto !important;
              max-width: 100% !important;
            }
    
            a.bulletproof-button {
              display: block !important;
              width: auto !important;
              font-size: 80%;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
    
            .columns {
              width: 100% !important;
            }
    
            .column {
              display: block !important;
              width: 100% !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
    
            .social-icon-column {
              display: inline-block !important;
            }
          }
        </style>
        <!--user entered Head Start-->
        <!--End Head user entered-->
      </head>
      <body bgcolor="" style="height: 100%; margin-top: 0px;">
        <center class="wrapper" data-body-style="font-size:16px; font-family:verdana,geneva,sans-serif; color:#516775; background-color:#fff;">
          <div class="webkit">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%" class="wrapper" bgcolor="#fff">
              <tr>
                <td valign="top" bgcolor="#fff" width="100%">
                  <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="100%">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%;" align="center">
                                <tr>
                                  <td role="modules-container" style="
                                          padding: 0px 0px 0px 0px;
                                          color: #516775;
                                          text-align: left;
                                        " bgcolor="#fff" width="100%" align="left">
                                    <table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="4UqFsRLozLcypAAv4CeoFS">
                                      <tbody>
                                        <tr>
                                          <td style="
                                                  font-size: 6px;
                                                  line-height: 10px;
                                                  padding: 30px 0px 0px 0px;
                                                " valign="top" align="center">
                                            <img class="max-width" border="0" style="
                                                    display: block;
                                                    color: #000000;
                                                    text-decoration: none;
                                                    font-family: Helvetica, arial,
                                                      sans-serif;
                                                    font-size: 16px;
                                                    max-width: 50px !important;
                                                    width: 10%;
                                                    height: 50px !important;
                                                  " src="${logoUrl}" alt="" width="200" data-responsive="true" data-proportionally-constrained="false" />
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="iqe7juSSgLbdm3gXWExpsY">
                                      <tbody>
                                        <tr>
                                          <td style="padding: 0px 0px 30px 0px" role="module-content" bgcolor=""></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; table-layout: fixed; " data-muid="8VquPM2ZMj7RJRhAUE6wmF" data-mc-module-version="2019-10-22">
                                      <tbody>
                                        <tr>
                                          <td data-test-id="block-wrapper" style="
                                                  line-height: 30px;
                                                  text-align: inherit;
                                                " height="100%" valign="top" bgcolor="#ffffff">
                                            <p> Mr/Mrs/Ms. ${customerName}</p>
                                            <p>Dear Sir/Mam,</p>
                                            <p> Your Personal loan has been sanctioned from ${clientName}, details as below </p>
                                            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                                              <thead>
                                                <tr>
                                                  <th style="border:1px solid #ddd; background-color:#f2f2f2; border-top:2px solid #ddd; border-bottom:2px solid #ddd;"> S.No. </th>
                                                  <th style="border:1px solid #ddd; background-color:#f2f2f2; border-top:2px solid #ddd; border-bottom:2px solid #ddd; border-left:2px solid #ddd;"> Particulars </th>
                                                  <th style="border:1px solid #ddd; background-color:#f2f2f2; border-top:2px solid #ddd; border-bottom:2px solid #ddd; border-right:2px solid #ddd;"> Details </th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;"> 1 </td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;"> Application ID </td>
                                                  <td style="border-left:2px solid #ddd;"> ${applicationId} </td>
                                                </tr>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;">2</td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;">Sanction Date</td>
                                                  <td style="border-left:2px solid #ddd; paddingLeft: 4px;"> ${format(
                                                    approvalDate,
                                                    'do MMM yyyy',
                                                  )}</td>
                                                </tr>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;">3</td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;">Loan Amount</td>
                                                  <td style="border-left:2px solid #ddd; paddingLeft: 4px;"> ${formatIndianNumber(
                                                    approvalAmount,
                                                  )}</td>
                                                </tr>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;">4</td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;">Rate of interest</td>
                                                  <td style="border-left:2px solid #ddd; paddingLeft: 4px;">${roi}% per day</td>
                                                </tr>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;">5</td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;">Processing Fees @ 10%</td>
                                                  <td style="border-left:2px solid #ddd; paddingLeft: 4px;">${formatIndianNumber(
                                                    processingFees,
                                                  )}</td>
                                                </tr>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;">6</td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;">GST 18 % on Processing fee</td>
                                                  <td style="border-left:2px solid #ddd; paddingLeft: 4px;">${formatIndianNumber(
                                                    gstAmount,
                                                  )}</td>
                                                </tr>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;">7</td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;">Total Deduction (Processing fee+GST18%)</td>
                                                  <td style="border-left:2px solid #ddd; paddingLeft: 4px;">${formatIndianNumber(
                                                    totalDeductions,
                                                  )} </td>
                                                </tr>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;">8</td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;">Amount to be Disbursed</td>
                                                  <td style="border-left:2px solid #ddd; paddingLeft: 4px;"> ${formatIndianNumber(
                                                    disbursalAmount,
                                                  )}</td>
                                                </tr>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;">9</td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;">Repay Date</td>
                                                  <td style="border-left:2px solid #ddd; paddingLeft: 4px;">${format(
                                                    repayDate,
                                                    'dd-MM-yyyy',
                                                  )} </td>
                                                </tr>
                                                <tr style="border:1px solid #ddd;">
                                                  <td style="border-right:2px solid #ddd; paddingLeft: 4px;">10</td>
                                                  <td style="border-left:2px solid #ddd; border-right:2px solid #ddd; paddingLeft: 4px;">Repay Amount</td>
                                                  <td style="border-left:2px solid #ddd; paddingLeft: 4px;">${formatIndianNumber(
                                                    repayAmount,
                                                  )} </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <p style="font-weight: bold;">Terms & Conditions</p>
                                            <ol>
                                              <li> Please read terms and conditions carefully, After Disbursal no claim will be entertained. </li>
                                              <li> The Sanction of Loan will be valid for 24 hrs from the date of sanction. In case the loan remains undisbursed during the validity period. </li>
                                              <li> Loan disbursed to your designated bank account provided by you at the time of processing. </li>
                                              <li> Charge Schedule - E- Nach Return - Rs.500 + GST Overdue Charges - 0.25% of Per day </li>
                                            </ol>
                                            <p> With Regards, </p>
                                            <p> Credit Team </p>
                                            <br />
                                            <p style="font-weight: bold;"> ${clientName} </p>
                                            <p style="font-weight: bold;"> ${clientNbfc} </p>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              <!--[if mso]>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </center>
                                                        <![endif]-->
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
        </center>
      </body>
    </html>
      `;
};
