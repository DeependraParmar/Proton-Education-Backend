import { config } from "dotenv";
import express from "express";

const app = express();

config({
    path: "./config/config.env"
})



app.listen(process.env.PORT, () => {
    console.log(`Server live at http://localhost:${process.env.PORT}`);
})