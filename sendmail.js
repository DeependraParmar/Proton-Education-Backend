import { createTransport } from "nodemailer";

export const sendEmail = async (mailoptions) => {    

    const transporter = createTransport({
        host: "smtp.gmail.com",
        service: "gmail",
        port: 587,
        secure: false,
        auth: {
            user: process.env.MY_MAIL,
            pass: process.env.MY_PASSWORD,
        },
    });

    await transporter.sendMail(mailoptions);
}