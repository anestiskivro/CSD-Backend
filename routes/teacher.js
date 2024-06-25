const express = require('express');
const router = express.Router();
const cors = require('cors');
const xlsToJson = require('xls-to-json');
const db = require("../models")
const Students = db.Students;
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/getExams", async (req, res) => {
    const selectedCourse = req.query.selectedCourse;
    try {
        let result = await db.sequelize.query(
            'SELECT cid FROM courses WHERE code = ?',
            {
                replacements: [selectedCourse],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        const cid = result[0].cid
        result = await db.sequelize.query(
            'SELECT * FROM exams WHERE cid = ?',
            {
                replacements: [cid],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ exams: result });
        } else {
            res.status(404).json({ message: "TAs of this course not found" })
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' });
    }
})
router.post("/setExams", upload.single('formdata'), async (req, res) => {
    let data = req.body;
    let cid = data.cid;
    try {
        result = await db.sequelize.query(
            'SELECT cid FROM courses WHERE code = ?',
            {
                replacements: [cid],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    }
    cid = result[0].cid
    data.cid = cid
    const values = Object.values(data);
    try {
        result = await db.sequelize.query(
            'INSERT INTO Exams (cid,name,fromDate,toDate,duration) VALUES (?,?,?,?,?)',
            {
                replacements: values,
                type: db.sequelize.QueryTypes.INSERT
            }
        );
        res.status(200).json({ message: 'Data inserted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while inserting data into the database' });
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
router.post("/insertstud", upload.single('file'), async (req, res) => {
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
                    const emailExists = await Students.findOne({ where: { email: values[3] } });
                    if (emailExists) {
                        continue;
                    } else {
                        await db.sequelize.query(
                            'INSERT INTO Students (student_number, lastname, name, email,Status) VALUES (?, ?, ?, ?,?)',
                            {
                                replacements: values,
                                type: db.sequelize.QueryTypes.INSERT
                            }
                        );
                    }
                }
                res.status(200).json({ message: 'Data imported successfully' });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' });
    }
});

router.post("/SetTAs", upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const { selectedCourse } = req.body;
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
                const headers = Object.keys(result[0]);
                for (const row of result) {
                    const values = headers.map(header => row[header]);
                    values.push(selectedCourse);
                    values.push("active");
                    await db.sequelize.query(
                        'INSERT INTO teachingassistants (ta_number, lastname, name, email,code,Status) VALUES (?, ?, ?, ?,?,?)',
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
router.get("/getSlots", async (req, res) => {
    const lastname_ta = req.query.teaching_assistant;
    const eid = req.query.exam.eid;
    const cid = req.query.cid;
    console.log(eid, cid)
    try {
        let result = await db.sequelize.query(
            'SELECT taid FROM teachingassistants WHERE lastname = ?',
            {
                replacements: [lastname_ta],
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (result.length === 0) {
            return res.status(404).json({ message: "Teaching assistant not found" });
        }

        const taid = result[0].taid;

        result = await db.sequelize.query(
            'SELECT * FROM availableslots WHERE taid = ? AND eid = ? AND cid = ?',
            {
                replacements: [taid, eid, cid],
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (result.length > 0) {
            res.status(200).json({ slots: result });
        } else {
            res.status(200).json({ message: "Slots were not found" });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});
router.get("/getTAs", async (req, res) => {
    const selectedCourses = req.query.selectedCourse;
    let result;
    let TAs = [];
    if (selectedCourses.length === 1) {
        const courseCode = selectedCourses;
        result = await db.sequelize.query(
            'SELECT * FROM teachingassistants WHERE code = ?',
            {
                replacements: [courseCode],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result.length > 0) {
            res.status(200).json({ TAs: result });
        } else {
            res.status(404).json({ message: "TAs for these course not found" });
        }
    } else {
        try {
            for (let i = 0; i < selectedCourses.length; i++) {
                const courseCode = selectedCourses[i].code;
                result = await db.sequelize.query(
                    'SELECT * FROM teachingassistants WHERE code = ?',
                    {
                        replacements: [courseCode],
                        type: db.sequelize.QueryTypes.SELECT
                    }
                );
                if (result.length > 0) {
                    TAs = TAs.concat(result);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'An error occurred while fetching data' });
        }
        if (TAs.length > 0) {
            res.status(200).json({ TAs: TAs });
        } else {
            res.status(404).json({ message: "TAs for these courses not found" });
        }
    }
});
router.get("/getNotes", async (req, res) => {
    const selectedTA = req.query.teaching_assistant;
    try {
        let result = await db.sequelize.query(
            'SELECT taid FROM teachingassistants WHERE lastname = ?',
            {
                replacements: [selectedTA],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        const taid = result[0].taid
        result = await db.sequelize.query(
            'SELECT * FROM appointments WHERE taid = ? AND evaluation_info IS NOT NULL ',
            {
                replacements: [taid],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ evaluations: result })
        } else {
            res.status(404).json({ message: "Evaluations were not found" })
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' });
    }
})
router.get("/getStudentsSlots", async (req, res) => {
    const selectedCourse = req.query.selectedCourse;
    const selectedExam = req.query.selectedExam;
    try {
        const [courseResult] = await db.sequelize.query(
            'SELECT cid FROM courses WHERE code = ?',
            {
                replacements: [selectedCourse],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        const cid = courseResult.cid;
        const [examResult] = await db.sequelize.query(
            'SELECT eid FROM exams WHERE name = ? AND cid = ?',
            {
                replacements: [selectedExam, cid],
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        const eid = examResult.eid;

        const result = await db.sequelize.query(
            'SELECT * FROM appointments WHERE cid = ? AND eid = ?',
            {
                replacements: [cid, eid],
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        res.status(200).json({ slots: result });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});
router.get("/getStudents", async (req, res) => {
    try {
        const result = await db.sequelize.query(
            'SELECT * FROM students ',
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        if (result) {
            res.status(200).json({ students: result })
        } else {
            res.status(404).json({ message: "Students were not found" })
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while importing data' });
    }
})
module.exports = router;