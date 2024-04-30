const userModel = require("../Models/User.Model");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// const secretKey = process.env.SECRET;
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const secretKeyLength = 32;
const secretKey = crypto.randomBytes(secretKeyLength).toString('hex');


const emailGen = () => {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 11; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text + "@gmail.com"; // Append a domain to make it a valid email address
};


const createUser = (req, res) => {
    const { firstName, lastName, email, password, accountNumber } = req.body;
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    const verificationToken = emailGen();
    const Sendemail = email;
    function generateAccountNumber(){
        const randomNumber = Math.floor(Math.random() * Math.pow(10, 10));
        const accountNumber = randomNumber.toString().padStart(10, '0');
        return accountNumber
    }

    const accNo = generateAccountNumber()

    const user = new userModel({
        firstName,
        lastName,
        accountNumber: accNo,
        password: hashedPassword,
        emailLink: {
            email: Sendemail,
            verified: false,
            verificationToken
        }
    });

    user.save()
    .then((response) => {
        console.log(Sendemail);
        emailLink(Sendemail)
        console.log("User registered successfully");
        res.status(201).json({
            message: "User registered successfully",
            data: response
        });
    })
    .catch((err) => {
        console.error("Error registering user:", err);
        if(err) {
            res.status(500).json({
                message: "Error registering user",
                error: err
            })
        }
    });
}

const loginUser = (req, res) => {
    const { email, password } = req.body;
    userModel.findOne({ email: email })
    .then((user) => {
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }
        const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: "1h" });
        res.status(200).json({
            message: "Login successful",
            token: token,
            userId: user._id
        });
    })
    .catch((error) => {
        console.error("Login failed:", error);
        res.status(500).json({ message: "Login failed" });
    });
}

const dashboard = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, secretKey, async (err, decoded) => {
            if (err) {
                console.error("Error verifying token:", err);
                return res.status(401).json({ status: false, message: "Unauthorized" });
            } else {
                console.log(decoded);
                const user = await userModel.findById(decoded.userId);
                if (!user) {
                    return res.status(404).json({ status: false, message: "User not found" });
                }
                res.status(200).json({ status: true, message: "Welcome to the dashboard", user });
            }
        });
    }catch(err){
        console.error("Error occurred during dashboard access:", err);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
   
}

const emailLink = async (email, res) => {
    try {
        let user = await userModel.findOne({ "emailLink.email": email });
        if (user) {
            const verify = user.emailLink.verificationToken;
            const toEmail = user.emailLink.email;
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
                }
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: toEmail,
                subject: 'Email Verification',
                text: 'That was easy!',
                html: `<p>Click the link below to verify your email account</p> 
                       <a href="${verify}">Verify your email</a>`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    return res.status(500).json({
                        message: "Error sending email"
                    });
                } else {
                    console.log('Email sent:', info.response);
                    return res.status(200).json({
                        message: "Email sent successfully"
                    });
                }
            });
        } else {
            return res.status(404).json({
                message: "User not found"
            });
        }
    } catch (err) {
        console.error("Error occurred during email verification:", err);
        return res.status(500).json({
            message: "Error occurred during email verification"
        });
    }
}


module.exports = { createUser, loginUser, dashboard, emailLink };
