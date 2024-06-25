const express = require('express');
const cors = require('cors');
const xlsToJson = require('xls-to-json');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { QueryTypes } = require('sequelize');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const db = require("./models");
const Students = db.Students;
const TeachingAssistants = db.TeachingAssistant;
const Teachers = db.Teachers;
require("dotenv").config();
// mysql://uy4hmtwm04ye45zx:sf575ctffifxejoq@q7cxv1zwcdlw7699.chr7pe7iynqr.eu-west-1.rds.amazonaws.com:3306/zf3pqihq6tayzonu for config.json
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
    saveUninitialized: false,
    cookie: {
        httpOnly: false,
        maxAge: 15000 * 60 * 60 * 24,
        sameSite: 'strict'
    }
}));
const students_router = require("./routes/students");
app.use("/student", cors(corsOptions), students_router);

const teacher_router = require("./routes/teacher");
app.use("/teacher", cors(corsOptions), teacher_router);

const t_assistant_router = require("./routes/t_assistants");
app.use("/tassistant", cors(corsOptions), t_assistant_router);

app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).json({ error: 'An error occurred while logging out.' });
            } else {
                res.status(200).json({ message: 'Logout successful' });
            }
        });
    } else {
        res.status(401).json({ message: 'You are not logged in' });
    }
});

app.post('/admin/insertcourses', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        console.log('Uploaded file path:', filePath);
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        xlsToJson({
            input: filePath,
            output: null,
            headers: true
        }, async (error, result) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'An error occurred while parsing the Excel file' });
            } else {
                console.log('Result:', result);
                const headers = Object.keys(result[0]);
                for (const row of result) {
                    const values = headers.map(header => row[header]);
                    await db.sequelize.query(
                        'INSERT INTO courses (department, code, title,instructor,ects,type) VALUES (?, ?, ?,?,?,?)',
                        {
                            replacements: values,
                            type: db.sequelize.QueryTypes.INSERT
                        }
                    );
                }
                res.status(200).json({ message: 'Data imported successfully' });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' });
    }
});

app.post('/admin', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        console.log('Uploaded file path:', filePath);
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        xlsToJson({
            input: filePath,
            output: null,
            headers: true
        }, async (error, result) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'An error occurred while parsing the Excel file' });
            } else {
                console.log('Result:', result);
                const headers = Object.keys(result[0]);
                for (const row of result) {
                    const values = headers.map(header => row[header]);
                    await db.sequelize.query(
                        'INSERT INTO teachers (lastname, name, email) VALUES (?, ?, ?)',
                        {
                            replacements: values,
                            type: db.sequelize.QueryTypes.INSERT
                        }
                    );
                }
                res.status(200).json({ message: 'Data imported successfully' });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' });
    }
});

app.get('/', async (req, res) => {
    try {
        const email = req.session.email;
        if (!email) {
            return res.status(401).json({ loggedIn: false });
        }
        if (email.includes("admin")) {
            return res.status(200).json({ id: "admin", email: email });
        }
        const userStud = await Students.findOne({ where: { email: email } });
        const userTA = await TeachingAssistants.findOne({ where: { email: email } });
        const userTeach = await Teachers.findOne({ where: { email: email } });

        if (userTeach) {
            return res.status(200).json({ id: "teacher", email: userTeach.email, loggedIn: true });
        } else if (userTA) {
            return res.status(200).json({ id: "TA", email: userTA.email, loggedIn: true });
        } else if (userStud) {
            return res.status(200).json({ id: "student", email: userStud.email, loggedIn: true });
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
        if (email.includes("admin")) {
            req.session.email = email;
            res.status(200).json({ id: "admin", email: email });
            return;
        }

        const userStud = await Students.findOne({ where: { email: email } });
        const userTA = await TeachingAssistants.findOne({ where: { email: email } });
        const userTeach = await Teachers.findOne({ where: { email: email } });

        if (userTeach) {
            req.session.email = userTeach.email;
            res.status(200).json({ id: "teacher", email: userTeach.email });
        } else if (userTA) {
            req.session.email = userTA.email;
            res.status(200).json({ id: "TA", email: userTA.email });
        } else if (userStud) {
            req.session.email = userStud.email;
            res.status(200).json({ id: "student", email: userStud.email });
        } else {
            res.status(401).json({ loggedIn: false });
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
