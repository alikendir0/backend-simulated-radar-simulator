import express from "express";
import cors from 'cors';
import path from "path";

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use("/images/icons", express.static(path.join(__dirname, "images/icons")));
console.log("Serving static files from:", path.join(__dirname, "images/icons"));


export default app;