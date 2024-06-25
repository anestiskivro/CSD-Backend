const express = require('express');
const cors = require('cors');
const xlsToJson = require('xls-to-json');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { QueryTypes } = require('sequelize');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed
const app = express();
const db = require("./models");
const Students = db.Students;
const TeachingAssistants = db.TeachingAssistant;
const Teachers = db.Teachers;
require("dotenv").config();

const allowedOrigins = [
    'https://main--rendezvous-csd.netlify.app',
    'https://rendezvous-csd.netlify.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        console.log(`Origin: ${origin}`);
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-Custom-Header,Access-Control-Allow-Origin,Access-Control-Allow-Methods,Access-Control-Allow-Credentials'
};

const PORT = process.env.PORT || 3001;

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15000 * 60 * 60 * 24
    }
}));

const students_router = require("./routes/students");
app.use("/student", cors(corsOptions), students_router);

const teacher_router = require("./routes/teacher");
app.use("/teacher", cors(corsOptions), teacher_router);

const t_assistant_router = require("./routes/t_assistants");
app.use("/tassistant", cors(corsOptions), t_assistant_router);

app.post('/logout', async (req, res) => {
    if (req.session) {
        req.session.destroy(async (err) => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).json({ error: 'An error occurred while logging out.' });
            } else {
                await fetch('https://your-netlify-site.netlify.app/.netlify/edge-functions/clear-cookie');
                res.status(200).json({ message: 'Logout successful' });
            }
        });
    } else {
        res.status(401).json({ message: 'You are not logged in' });
    }
});

app.get('/', async (req, res) => {
    try {
        const email = req.session.email;
        if (!email) {
            return res.status(401).json({ loggedIn: false });
        }

        if (email.includes("admin")) {
            await fetch(`https://your-netlify-site.netlify.app/.netlify/edge-functions/set-cookie?email=${email}&sessionId=${req.session.id}`);
            return res.status(200).json({ id: "admin", email: email });
        }

        const userStud = await Students.findOne({ where: { email: email } });
        const userTA = await TeachingAssistants.findOne({ where: { email: email } });
        const userTeach = await Teachers.findOne({ where: { email: email } });

        if (userTeach) {
            await fetch(`https://your-netlify-site.netlify.app/.netlify/edge-functions/set-cookie?email=${userTeach.email}&sessionId=${req.session.id}`);
            return res.status(200).json({ id: "teacher", email: userTeach.email });
        } else if (userTA) {
            await fetch(`https://your-netlify-site.netlify.app/.netlify/edge-functions/set-cookie?email=${userTA.email}&sessionId=${req.session.id}`);
            return res.status(200).json({ id: "TA", email: userTA.email });
        } else if (userStud) {
            await fetch(`https://your-netlify-site.netlify.app/.netlify/edge-functions/set-cookie?email=${userStud.email}&sessionId=${req.session.id}`);
            return res.status(200).json({ id: "student", email: userStud.email });
        } else {
            return res.status(401).json({ loggedIn: false });
        }
    } catch (error) {
        console.error('Error in authentication:', error);
        res.status(500).json({ error: 'An error occurred during authentication.' });
    }
});

app.post('/', async (req, res) => {
    const email = req.body.email;
    try {
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        if (email.includes("admin")) {
            req.session.email = email;
            return req.session.save(async (err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Failed to save session' });
                }
                await fetch(`https://your-netlify-site.netlify.app/.netlify/edge-functions/set-cookie?email=${email}&sessionId=${req.session.id}`);
                res.status(200).json({ id: "admin", email: email });
            });
        }

        const userStud = await Students.findOne({ where: { email: email } });
        const userTA = await TeachingAssistants.findOne({ where: { email: email } });
        const userTeach = await Teachers.findOne({ where: { email: email } });

        if (userTeach) {
            req.session.email = userTeach.email;
            return req.session.save(async (err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Failed to save session' });
                }
                await fetch(`https://your-netlify-site.netlify.app/.netlify/edge-functions/set-cookie?email=${userTeach.email}&sessionId=${req.session.id}`);
                res.status(200).json({ id: "teacher", email: userTeach.email });
            });
        } else if (userTA) {
            req.session.email = userTA.email;
            return req.session.save(async (err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Failed to save session' });
                }
                await fetch(`https://your-netlify-site.netlify.app/.netlify/edge-functions/set-cookie?email=${userTA.email}&sessionId=${req.session.id}`);
                res.status(200).json({ id: "TA", email: userTA.email });
            });
        } else if (userStud) {
            req.session.email = userStud.email;
            return req.session.save(async (err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Failed to save session' });
                }
                await fetch(`https://your-netlify-site.netlify.app/.netlify/edge-functions/set-cookie?email=${userStud.email}&sessionId=${req.session.id}`);
                res.status(200).json({ id: "student", email: userStud.email });
            });
        } else {
            return res.status(401).json({ loggedIn: false });
        }
    } catch (err) {
        console.error('Error in login process:', err);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
