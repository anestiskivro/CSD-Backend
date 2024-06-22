const express = require('express');
const router = express.Router();
const cors = require('cors');
const db = require("../models")
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


const bodyParser = require('body-parser');

router.use(bodyParser.json());
const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: 'uocappointment@gmail.com',
        pass: 'fwni zden fuzj hybd',
    },
    secure: true,
});


router.get("/getStudents", async (req, res) => {
    try {
        const result = await db.sequelize.query(
            'SELECT * FROM students',
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ students: result })
        } else {
            res.status(404).json({ message: "Comments not found" })
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }
})
router.get("/getComments", async (req, res) => {
    try {
        const result = await db.sequelize.query(
            'SELECT * FROM comments',
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ comments: result })
        } else {
            res.status(404).json({ message: "Comments not found" })
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }
})
router.get("/getExams", async (req, res) => {
    try {
        const result = await db.sequelize.query(
            'SELECT * FROM exams',
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ exams: result })
        } else {
            res.status(404).json({ message: "Comments not found" })
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }
})
router.get("/getappointments", async (req, res) => {
    try {
        result = await db.sequelize.query(
            'SELECT * FROM appointments',
            {
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

router.post("/book", async (req, res) => {
    const { dates, hours, cid, eid, email, duration } = req.body;
    let slots;
    let exists;
    try {
        // Query to get TAID from email
        let result = await db.sequelize.query(
            'SELECT taid FROM teachingassistants WHERE email = ?',
            {
                replacements: [email],
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        const taid = result[0].taid;

        for (let i = 0; i < dates.length; i++) {
            const date = dates[i];
            const hourArray = hours[i];

            for (const period of hourArray) {
                const { start, end } = period;
                const { hour: startHour, minute: startMinute } = start;
                const { hour: endHour, minute: endMinute } = end;

                let currentHour = parseInt(startHour, 10);
                let currentMinute = parseInt(startMinute, 10);
                const endHourParsed = parseInt(endHour, 10);
                const endMinuteParsed = parseInt(endMinute, 10);
                const parsedDuration = parseInt(duration, 10);
                while (
                    currentHour < endHourParsed ||
                    (currentHour === endHourParsed && currentMinute + parsedDuration <= endMinuteParsed)
                ) {
                    let startTime = `${currentHour}:${currentMinute < 10 ? '0' + currentMinute : currentMinute}`;
                    let slotEndHour = currentHour;
                    let slotEndMinute = currentMinute + parsedDuration;

                    if (slotEndMinute >= 60) {
                        slotEndHour += Math.floor(slotEndMinute / 60);
                        slotEndMinute = slotEndMinute % 60;
                    }

                    let endTime = `${slotEndHour}:${slotEndMinute < 10 ? '0' + slotEndMinute : slotEndMinute}`;

                    [exists] = await db.sequelize.query(
                        'SELECT slotId FROM availableslots WHERE cid = ? AND eid = ? AND taid = ? AND date = ? AND fromTime = ? AND endTime = ?', {
                        replacements: [cid, eid, taid, date, startTime, endTime],
                        type: db.sequelize.QueryTypes.INSERT
                    });
                    if (exists) {
                        currentHour = slotEndHour;
                        currentMinute = slotEndMinute;
                        continue;
                    }
                    slots = await db.sequelize.query(
                        'INSERT INTO availableslots (cid, eid, taid, date, fromTime, endTime, Status) VALUES (?, ?, ?, ?, ?, ?, ?)', {
                        replacements: [cid, eid, taid, date, startTime, endTime, "pending"],
                        type: db.sequelize.QueryTypes.INSERT
                    });
                    // Move to the next slot
                    currentHour = slotEndHour;
                    currentMinute = slotEndMinute;

                }
            }
        }
        if (slots) {
            res.status(200).json({ message: "Slots inserted successfully" });
        } else {
            res.status(404).json({ message: "We couldn't insert your slots " });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }

})
router.delete("/cancel", async (req, res) => {
    const checkboxes = req.body.checkboxes;
    try {
        for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].Status === "booked") {
                let result = await db.sequelize.query(
                    'SELECT studentId FROM appointments WHERE slotid = ?', {
                    replacements: [checkboxes[i].slotid],
                    type: db.sequelize.QueryTypes.SELECT
                });
                const stud_id = result[0].studentId
                result = await db.sequelize.query(
                    'SELECT email FROM students WHERE id = ?', {
                    replacements: [stud_id],
                    type: db.sequelize.QueryTypes.SELECT
                });
                const email = result[0].email
                const mailOptions = {
                    from: 'uocappointment@gmail.com',
                    to: email,
                    subject: 'Cancellation of your appointment',
                    text: `Hello ${email}, this is a cancelation email for your slot time ${FromTime} - ${EndTime} at ${date} for ${code[0].code} ${exam[0].name}. Please book another slot`,
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log("Email sent");
                });
            }
            result = await db.sequelize.query(
                'DELETE FROM availableslots WHERE slotid = ?', {
                replacements: [checkboxes[i].slotid],
                type: db.sequelize.QueryTypes.DELETE
            });
        }
        res.status(200).json({ message: 'Data delete successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }
})
router.get("/getSlots", async (req, res) => {
    const email = req.query.email;
    try {
        let result = await db.sequelize.query(
            'SELECT taid FROM teachingassistants WHERE email = ?',
            {
                replacements: [email],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        const taid = result[0].taid
        result = await db.sequelize.query(
            'SELECT * FROM availableslots WHERE taid = ? ',
            {
                replacements: [taid],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ slots: result });
        } else {
            res.status(404).json({ error: 'Slots not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }
})
router.get("/book", async (req, res) => {
    const selectedCourse = req.query.selectedCourse;
    try {
        const result = await db.sequelize.query(
            'SELECT cid FROM courses WHERE code = ?',
            {
                replacements: [selectedCourse],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        cid = result[0].cid;
        const result1 = await db.sequelize.query(
            'SELECT * FROM exams WHERE cid = ? ', {
            replacements: [cid],
            type: db.sequelize.QueryTypes.SELECT
        }
        )
        if (result1) {
            res.status(200).json({ exams: result1 });
        } else {
            res.status(404).json({ error: 'Exams not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }
});
router.get("/", async (req, res) => {
    let data;
    try {
        data = await db.sequelize.query(
            'SELECT * FROM courses',
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' });
    }
    res.status(200).json({ data });
})

router.post("/addeval", upload.single('formdata'), async (req, res) => {
    try {
        let { email, evaluation, code, exam, studentemail } = req.body;

        const cid = await db.sequelize.query('SELECT cid FROM courses WHERE code = ?', {
            replacements: [code],
            type: db.sequelize.QueryTypes.SELECT
        });
        const eid = await db.sequelize.query('SELECT eid FROM exams WHERE name = ?', {
            replacements: [exam],
            type: db.sequelize.QueryTypes.SELECT
        });
        const studentId = await db.sequelize.query('SELECT id FROM students WHERE email = ?', {
            replacements: [studentemail],
            type: db.sequelize.QueryTypes.SELECT
        });
        const taid = await db.sequelize.query('SELECT taid FROM teachingassistants WHERE email = ?', {
            replacements: [email],
            type: db.sequelize.QueryTypes.SELECT
        });

        if (!cid.length || !eid.length || !studentId.length || !taid.length) {
            return res.status(404).json({ message: "Invalid input data" });
        }

        const values = [studentId[0].id, taid[0].taid, eid[0].eid, cid[0].cid];

        const result = await db.sequelize.query(
            'SELECT id FROM appointments WHERE studentId = ? AND taid = ? AND eid = ? AND cid = ?',
            {
                replacements: values,
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (result.length) {
            await db.sequelize.query(
                'UPDATE appointments SET evaluation_info = ? WHERE id = ?',
                {
                    replacements: [evaluation, result[0].id],
                    type: db.sequelize.QueryTypes.UPDATE
                }
            );
            res.status(200).json({ message: "Evaluation updated successfully" });
        } else {
            res.status(404).json({ message: "Appointment not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router