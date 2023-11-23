const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "email-smtp.us-west-2.amazonaws.com",
  port: 587,
  secure: false,
  auth: {
    user: "AKIAWNU34O3Z5WARRWHT",
    pass: "BEq1xne2IpCkhm+NFC0fHMEUqEU90/vGkpVM4Rn7zpt+",
  },
});

module.exports.sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info);
  } catch (error) {
    console.log("Error sending email:", error);
  }
};
