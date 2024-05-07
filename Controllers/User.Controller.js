const userModel = require("../Models/User.Model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const secretKeyLength = 32;
const secretKey = crypto.randomBytes(secretKeyLength).toString("hex");

const emailGen = () => {
    let text = "";
    let possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 11; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text + "@gmail.com";
};

const createUser = (req, res) => {
    const { firstName, lastName, email, password, accountNumber } = req.body;
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    const verificationToken = emailGen();
    const Sendemail = email;
    function generateAccountNumber() {
        const randomNumber = Math.floor(Math.random() * Math.pow(10, 10));
        const accountNumber = randomNumber.toString().padStart(10, "0");
        return accountNumber;
    }

    const accNo = generateAccountNumber();

    const user = new userModel({
        firstName,
        lastName,
        accountNumber: accNo,
        password: hashedPassword,
        emailLink: {
            email: Sendemail,
            verified: false,
            verificationToken,
        },
    });

    user
        .save()
        .then((response) => {
            console.log(Sendemail);
            emailLink(Sendemail);
            console.log("User registered successfully");
            res.status(201).json({
                message: "User registered successfully",
                data: response,
            });
        })
        .catch((err) => {
            console.error("Error registering user:", err);
            if (err) {
                res.status(500).json({
                    message: "Error registering user",
                    error: err,
                });
            }
        });
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await userModel.findOne({ "emailLink.email": email });

        if (!user) {
            return res.status(401).json({
                Message: "User does not exist, please sign up",
            });
        } else {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    Message: "Invalid credentials",
                });
            } else {
                const token = jwt.sign({ id: user._id }, secretKey, {
                    expiresIn: "1h",
                });
                res.status(200).json({
                    Message: "Login successful",
                    token: token,
                });
            }
        }
    } catch {
        console.error("Error logging in user:", err);
        res.status(500).json({
            Message: "Error logging in user",
            error: err,
        });
    }
};

const dashboard = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, secretKey, async (err, decoded) => {
            console.log(err, decoded);
            if (err) {
                console.error("Error verifying token:", err);
                return res
                    .status(401)
                    .json({ status: false, message: "Unauthorized", err });
            } else {
                console.log(decoded);
                const user = await userModel.findById(decoded.id);
                if (user) {
                    res
                        .status(200)
                        .json({ status: true, message: "Welcome to the dashboard", user });
                }
            }
        });
    } catch (err) {
        console.error("Error occurred during dashboard access:", err);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

const emailLink = async (email, res) => {
    try {
        let user = await userModel.findOne({ "emailLink.email": email });
        if (user) {
            const verify = user.emailLink.verificationToken;
            const toEmail = user.emailLink.email;

            const transporter = nodemailer.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: toEmail,
                subject: "Email Verification",
                text: "That was easy!",
                html: `<p>Click the link below to verify your email account</p> 
                       <a href="${verify}">Verify your email</a>`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    return res.status(500).json({
                        message: "Error sending email",
                    });
                } else {
                    console.log("Email sent:", info.response);
                    return res.status(200).json({
                        message: "Email sent successfully",
                    });
                }
            });
        } else {
            return res.status(404).json({
                message: "User not found",
            });
        }
    } catch (err) {
        console.error("Error occurred during email verification:", err);
        return res.status(500).json({
            message: "Error occurred during email verification",
        });
    }
};


const sendEmail = async (email, text) => {
    try {
        let user = await userModel.findOne({ "emailLink.email": email });
        if (user) {
            const verify = user.emailLink.verificationToken;
            const toEmail = user.emailLink.email;

            const transporter = nodemailer.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: toEmail,
                subject: "Email Verification",
                text: "That was easy!",
                html: text
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    return res.status(500).json({
                        message: "Error sending email",
                    });
                } else {
                    console.log("Email sent:", info.response);
                    return res.status(200).json({
                        message: "Email sent successfully",
                    });
                }
            });
        } else {
            return res.status(404).json({
                message: "User not found",
            });
        }
    } catch (err) {
        console.error("Error occurred during email verification:", err);
        return res.status(500).json({
            message: "Error occurred during email verification",
        });
    }
};

function generateRandomText() {
    function shuffleString(str) {
        const arr = str.split("");
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join("");
    }

    const capLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerLetters = "abcdefghijklmnopqrstuvwxyz";
    const specialChars = "!@#$%^&*()_+{}[]";
    const numbers = "0123456789";

    let randomString = "";

    // Generate 2 uppercase letters
    for (let i = 0; i < 2; i++) {
        const randomIndex = crypto.randomInt(0, capLetters.length);
        randomString += capLetters[randomIndex];
    }

    // Generate 3 lowercase letters
    for (let i = 0; i < 3; i++) {
        const randomIndex = crypto.randomInt(0, lowerLetters.length);
        randomString += lowerLetters[randomIndex];
    }

    // Generate 2 special characters
    for (let i = 0; i < 2; i++) {
        const randomIndex = crypto.randomInt(0, specialChars.length);
        randomString += specialChars[randomIndex];
    }

    // Generate 2 numbers
    for (let i = 0; i < 2; i++) {
        const randomIndex = crypto.randomInt(0, numbers.length);
        randomString += numbers[randomIndex];
    }

    // Shuffle the generated string
    randomString = shuffleString(randomString);

    return randomString;
}

const resetPassword = async (req, res) => {
    const { email } = req.body;
    let user = await userModel.findOne({ "emailLink.email": email });
    if (user) {
        const newPassword = generateRandomText();
        const hashedPassword = bcrypt.hashSync(newPassword, 10)
        user.password = hashedPassword
        user.save()
            .then((result) => {
                const text = `<h1> Your new password is: ${newPassword}</h1>`;
                sendEmail(user.emailLink.email, text)
                res.status(200).json({ msg: "Password reset successful", result })
            })
            .catch((err) => {
                res.status(500).json({ msg: "Password reset failed" })
            })
    } else {
        res.status(500).json({ mgs: "User not found" });
    }
};

module.exports = { createUser, loginUser, dashboard, emailLink, resetPassword };
