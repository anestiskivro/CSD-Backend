const express = require('express')
const router = express.Router()
const db = require("../models")
const nodemailer = require('nodemailer');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const schedule = require('node-schedule');

const allowedOrigins = [
    'https://main--rendezvous-csd.netlify.app',
    'https://rendezvous-csd.netlify.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization'
};
router.use(cors(corsOptions));
const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: 'uocappointment@gmail.com',
        pass: 'fwni zden fuzj hybd',
    },
    secure: true,
});


router.delete("/cancel", async (req, res) => {
    const checkboxes = req.body.checkboxes;
    try {
        for (let i = 0; i < checkboxes.length; i++) {
            let result = await db.sequelize.query(
                'DELETE FROM appointments WHERE id = ?', {
                replacements: [checkboxes[i].id],
                type: db.sequelize.QueryTypes.DELETE
            });
            result = db.sequelize.query(
                'UPDATE availableslots SET Status= ? WHERE slotid = ?', {
                replacements: ["pending", checkboxes[i].slotId],
                type: db.sequelize.QueryTypes.UPDATE
            });
        }
        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }
})
router.get("/findTA", async (req, res) => {
    const selectedExam = req.query.selectedExam;
    const cid = selectedExam.cid
    try {
        let result = await db.sequelize.query(
            'SELECT code FROM courses WHERE cid = ?',
            {
                replacements: [cid],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        code = result[0].code
        result = await db.sequelize.query(
            'SELECT * FROM teachingassistants WHERE code = ?',
            {
                replacements: [code],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ teaching_assistants: result })
        } else {
            res.status(404).json({ message: "Teaching Assistants were not found" })
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' })
    }
})

router.get("/getSlots", async (req, res) => {
    let date = req.query.date
    const lastname_ta = req.query.teaching_assistant
    try {
        let result = await db.sequelize.query(
            'SELECT taid FROM teachingassistants WHERE lastname = ? ',
            {
                replacements: [lastname_ta],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        const taid = result[0].taid
        result = await db.sequelize.query(
            'SELECT * FROM availableslots WHERE taid = ? AND date = ? AND Status = ? ',
            {
                replacements: [taid, date, "pending"],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ availableSlots: result })
        } else {
            res.status(404).json({ message: "Slots were not found" })
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' })
    }
})
router.get("/getappointments", async (req, res) => {
    const email = req.query.email;
    try {
        let result = await db.sequelize.query(
            'SELECT id FROM students WHERE email = ?',
            {
                replacements: [email],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        const id = result[0].id
        result = await db.sequelize.query(
            'SELECT * FROM appointments WHERE studentId = ?',
            {
                replacements: [id],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ appointments: result });
        } else {
            res.status(404).json({ error: 'appointments not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }
})
router.get("/getexams", async (req, res) => {
    try {
        const result = await db.sequelize.query(
            'SELECT * FROM exams',
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result.length > 0) {
            res.status(200).json({ exams: result });
        } else {
            res.status(404).send("exams not found");
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while fetching courses' });
    }
});
router.get("/getcourses", async (req, res) => {
    try {
        const result = await db.sequelize.query(
            'SELECT * FROM courses',
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result.length > 0) {
            res.status(200).json({ courses: result });
        } else {
            res.status(404).send("Courses not found");
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while fetching courses' });
    }
});
router.post("/book", async (req, res) => {
    const { date, cid, eid, email, FromTime, EndTime, selectedTA } = req.body;

    if (!date || !FromTime || !EndTime || !selectedTA || !email) {
        return res.status(400).send("Bad request: Missing required fields");
    }

    try {
        // Query 1: Fetch the TA ID based on lastname
        let result = await db.sequelize.query(
            'SELECT taid FROM teachingassistants WHERE lastname = ?',
            {
                replacements: [selectedTA],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result.length === 0) {
            return res.status(404).send("Teaching assistant not found");
        }
        const taid = result[0].taid;

        // Query 2: Fetch the student ID based on email
        result = await db.sequelize.query(
            'SELECT id FROM students WHERE email = ?',
            {
                replacements: [email],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result.length === 0) {
            return res.status(404).send("Student not found");
        }
        const student_id = result[0].id;

        // Query 3: Fetch the slot ID based on date, fromTime, and EndTime
        const result1 = await db.sequelize.query(
            'SELECT slotid FROM availableslots WHERE date = ? AND fromTime = ? AND EndTime = ?',
            {
                replacements: [date, FromTime, EndTime],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result1.length === 0) {
            return res.status(404).send("Available slot not found");
        }
        const slotid = result1[0].slotid;
        // Query 4 check if there is an appointment with the studentId and cid in order not to book a 2nd appointment
        const exist = await db.sequelize.query(
            'SELECT id FROM appointments WHERE studentId = ? AND cid = ? AND eid = ?',
            {
                replacements: [student_id, cid, eid],
                type: db.sequelize.QueryTypes.SELECT
            }
        )
        if (exist.length == 0) {
            result = await db.sequelize.query(
                'INSERT INTO appointments (studentId, slotId, taid, eid, cid, date, FromTime, Endtime, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                {
                    replacements: [student_id, slotid, taid, eid, cid, date, FromTime, EndTime, "pending"],
                    type: db.sequelize.QueryTypes.INSERT
                }
            );
            if (result) {
                const code = await db.sequelize.query('SELECT code FROM courses WHERE cid = ?',
                    {
                        replacements: [cid],
                        type: db.sequelize.QueryTypes.SELECT
                    });
                const exam = await db.sequelize.query('SELECT name FROM exams WHERE eid = ?',
                    {
                        replacements: [eid],
                        type: db.sequelize.QueryTypes.SELECT
                    });
                const mailOptions = {
                    from: 'uocappointment@gmail.com',
                    to: email,
                    subject: 'Confirmation of your appointment',
                    text: `Hello ${email}, this is a confirmation email for your slot time ${FromTime} - ${EndTime} at ${date} for ${code[0].code} ${exam[0].name}.`,
                };
                const mailOptionsRemind = {
                    from: 'uocappointment@gmail.com',
                    to: email,
                    subject: 'Reminder of your appointment',
                    text: `Hello ${email}, this is a reminder email for your slot time ${FromTime} - ${EndTime} at ${date} for ${code[0].code} ${exam[0].name}.`,
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    result = db.sequelize.query(
                        'UPDATE availableslots SET Status= ? WHERE slotid = ?', {
                        replacements: ["booked", slotid],
                        type: db.sequelize.QueryTypes.UPDATE
                    });
                });
                const conf_date = new Date(date);
                const dateOneDayBefore = new Date(conf_date.getTime());
                const job = schedule.scheduleJob(dateOneDayBefore, function () {
                    transporter.sendMail(mailOptionsRemind, (error, info) => {
                        if (error) {
                            return console.log(error);
                        }
                    });
                });
                if (result) {
                    res.status(200).json({ message: "You have successfully booked your appointment" })
                }
            }
        } else {
            return res.status(200).json({ message: "You have already booked a slot, first cancel and then book again" });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' })
    }
});


router.post("/addComment", upload.single('formdata'), async (req, res) => {
    try {
        let { email, comment, code, exam } = req.body;

        // Get course ID
        const [cidResult] = await db.sequelize.query('SELECT cid FROM courses WHERE code = ?', {
            replacements: [code],
            type: db.sequelize.QueryTypes.SELECT
        });
        if (!cidResult) return res.status(404).json({ message: "Course not found" });
        const cid = cidResult.cid;

        // Get exam ID
        const [eidResult] = await db.sequelize.query('SELECT eid FROM exams WHERE name = ?', {
            replacements: [exam],
            type: db.sequelize.QueryTypes.SELECT
        });
        if (!eidResult) return res.status(404).json({ message: "Exam not found" });
        const eid = eidResult.eid;

        // Get student ID
        const [studentResult] = await db.sequelize.query('SELECT id FROM students WHERE email = ?', {
            replacements: [email],
            type: db.sequelize.QueryTypes.SELECT
        });
        if (!studentResult) return res.status(404).json({ message: "Student not found" });
        const studentId = studentResult.id;

        // Get appointment details
        const [appointmentResult] = await db.sequelize.query('SELECT date, FromTime, EndTime FROM appointments WHERE studentId = ? AND eid = ? AND cid = ?', {
            replacements: [studentId, eid, cid],
            type: db.sequelize.QueryTypes.SELECT
        });
        if (!appointmentResult) return res.status(404).json({ message: "Appointment not found" });
        const { date, FromTime, EndTime } = appointmentResult;

        // Insert comment
        const values = [studentId, eid, cid, date, FromTime, EndTime, comment];
        const [result] = await db.sequelize.query(
            'INSERT INTO comments (studentId, eid, cid, date, FromTime, EndTime, Comment) VALUES (?, ?, ?, ?,?, ?, ?)', {
            replacements: values,
            type: db.sequelize.QueryTypes.INSERT
        }
        );

        if (result) {
            res.status(200).json({ message: "Comment inserted successfully" });
        } else {
            res.status(500).json({ message: "Failed to insert comment" });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "An error occurred while processing your request" });
    }
});

module.exports = router