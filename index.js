import { config } from "dotenv";
import express from "express";
import cors from "cors";
import zod from "zod";
import { sendEmail } from "./sendmail.js";
import path from "path";
import ejs from "ejs";

const app = express();
config({
    path: "./config/config.env"
});


app.use(cors({
    origin: [process.env.FRONTEND_URI_1, process.env.FRONTEND_URI_2, process.env.FRONTEND_URI_3]
}
));


app.use(express.json());
app.use(express.urlencoded({extended: true}));

// setting the template engine to ejs 
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// creating the default route for / get
app.get("/otp", async(req,res,next) => {
    res.render("otpTemplate", {otp: 123456});
})
app.get("/query", async(req,res,next) => {
    res.render("queryTemplate", {name: "Deependra Parmar", email: "deependraparmar1@gmail.com", phoneNumber: "1234567890", message: "Hello World" });
})

let temporaryData = {};

const sendMailZodSchema = zod.object({
    name: zod.string(),
    email: zod.string().email(),
    phoneNumber: zod.number().min(6000000000).max(9999999999),
    message: zod.string(),
});
app.post("/sendmail", async(req,res,next) => {
    try{
        const {success} = sendMailZodSchema.safeParse(req.body);
        if(!success){
            return res.status(400).json({
                success: false,
                message: "Invalid input",
            });
        }

        const {name, email, phoneNumber, message} = req.body;
        
        // generating an otp here
        const otp = Math.floor(100000 + Math.random() * 900000);

        temporaryData[email] = {
            name, email, phoneNumber, message, otp,
        }
        
        const emailTemplatePath = path.join(process.cwd(), "views", "otpTemplate.ejs");
        const emailTemplate = await ejs.renderFile(emailTemplatePath, {
            otp: otp,
        });

        let mailOptions = {
            to: email,
            from: `Proton Education <${process.env.MY_MAIL}> `,
            subject: "OTP for Proton Education",
            html: emailTemplate,
        }

        // sending the mail here
        await sendEmail(mailOptions);


        // sending the response
        res.status(200).json({
            success: true,
            message: "OTP sent to your mail. Also check spam folder.",
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

const verifyOtpZodSchema = zod.object({
    email: zod.string().email(),
    otp: zod.number().min(100000).max(999999),
});
app.post("/verifyotp", async(req,res,next) => {
    try{
        const {success} = verifyOtpZodSchema.safeParse(req.body);

        if(!success){
            return res.status(400).json({
                success: false,
                message: "Invalid input",
            });
        }

        const {email, otp} = req.body;
        const userData = temporaryData[email];

        if(!userData){
            return res.status(404).json({
                success: false,
                message: "Invalid email",
            });
        }

        if(userData.otp !== otp){
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        if(userData.otp === otp){
            const emailTemplatePath = path.join(process.cwd(), "views", "queryTemplate.ejs");
            const emailTemplate = await ejs.renderFile(emailTemplatePath, {
                name: userData.name,
                email: userData.email,
                phoneNumber: userData.phoneNumber,
                message: userData.message,
            });

            let mailOptions = {
                to: process.env.MY_MAIL,
                from: `Query from ${userData.name}`,
                subject: "New Query for Proton Education",
                html: emailTemplate,
            }

            await sendEmail(mailOptions);
            delete temporaryData[email];

            res.status(200).json({
                success: true,
                message: "We successfully received your query. We will contact you soon.",
            });
        }
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server live at http://localhost:${process.env.PORT}`);
});
