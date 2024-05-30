const express = require('express');
const cors = require('cors');
const xlsToJson = require('xls-to-json');
const multer = require('multer');
const { QueryTypes } = require('sequelize');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const db = require("./models");

const upload = multer({ dest: 'uploads/' });
const app = express();
const PORT = process.env.PORT || 3001;

// Synchronize database
(async () => {
    await db.Courses.sync();
    await db.Students.sync();
    await db.TeachingAssistant.sync();
    await db.Exams.sync();
    await db.AvailableSlots.sync();
    await db.Appointment.sync();
})();

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization'
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'This is a secret key for the site',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15000 * 60 * 60 * 24
    }
}));

// Routers
const students_router = require("./routes/students");
app.use("/student", students_router);

const teacher_router = require("./routes/teacher");
app.use("/teacher", teacher_router);

const t_assistant_router = require("./routes/t_assistants");
app.use("/tassistant", t_assistant_router);

app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).json({ error: 'An error occurred while logging out.' });
            } else {
                res.clearCookie('connect.sid');
                res.status(200).json({ message: 'Logout successful' });
            }
        });
    } else {
        res.status(401).json({ message: 'You are not logged in' });
    }
});

app.post('/admin/insertcourses', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const filePath = req.file.path;
        console.log('Uploaded file path:', filePath);

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
                        'INSERT INTO courses (department, code, title, instructor, ects, type) VALUES (?, ?, ?, ?, ?, ?)',
                        {
                            replacements: values,
                            type: QueryTypes.INSERT
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
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const filePath = req.file.path;
        console.log('Uploaded file path:', filePath);

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
                            type: QueryTypes.INSERT
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

app.get('/', (req, res) => {
    if (req.session.email) {
        res.send({ loggedIn: true, email: req.session.email });
    } else {
        res.send({ loggedIn: false });
    }
});

app.post('/', async (req, res) => {
    const email = req.body.email;
    let user;

    try {
        if (email.includes("admin")) {
            req.session.email = email;
            return res.status(200).json({ email: email });
        }

        const query = email.includes("csdp") ? 'SELECT email FROM teachingassistants WHERE email = :email' :
            email.includes("csd") ? 'SELECT email FROM students WHERE email = :email' :
                'SELECT email FROM teachers WHERE email = :email';

        user = await db.sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { email: email }
        });

        if (user && user.length > 0) {
            req.session.email = user[0].email;
            console.log(req.session.email);
            res.status(200).json({ email: req.session.email });
        } else {
            res.status(401).json({ loggedIn: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Start server
db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
