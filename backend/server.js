const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const ScheduleGenerator = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.get('/api/programs', async (req, res) => {
    try {
        const [programs] = await db.query('SELECT * FROM programs');
        res.json(programs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sections/generate', async (req, res) => {
    try {
        const { enrollments } = req.body;
        
        await db.query('DELETE FROM schedules');
        await db.query('DELETE FROM sections');
        
        const sections = [];
        for (const enrollment of enrollments) {
            const { program_id, year_level, total_students } = enrollment;
            
            const numSections = Math.ceil(total_students / 40);
            const baseSize = Math.floor(total_students / numSections);
            const remainder = total_students % numSections;
            
            for (let i = 0; i < numSections; i++) {
                const letter = String.fromCharCode(65 + i);
                const studentCount = baseSize + (i < remainder ? 1 : 0);
                
                const [result] = await db.query(
                    'INSERT INTO sections (program_id, year_level, letter, student_count) VALUES (?, ?, ?, ?)',
                    [program_id, year_level, letter, studentCount]
                );
                
                sections.push({
                    id: result.insertId,
                    program_id,
                    year_level,
                    letter,
                    student_count: studentCount
                });
            }
        }
        
        res.json({ success: true, sections });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sections', async (req, res) => {
    try {
        const [sections] = await db.query(`
            SELECT s.*, p.code as program_code, p.name as program_name
            FROM sections s
            JOIN programs p ON s.program_id = p.id
            ORDER BY p.code, s.year_level, s.letter
        `);
        res.json(sections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/courses', async (req, res) => {
    try {
        const { courses } = req.body;
        
        for (const course of courses) {
            await db.query(
                'INSERT INTO courses (code, name, type, hours_lecture, hours_lab, program_id, year_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [course.code, course.name, course.type, course.hours_lecture, course.hours_lab, course.program_id, course.year_level]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/courses', async (req, res) => {
    try {
        const [courses] = await db.query(`
            SELECT c.*, p.code as program_code, p.name as program_name
            FROM courses c
            JOIN programs p ON c.program_id = p.id
            ORDER BY p.code, c.year_level, c.code
        `);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/rooms', async (req, res) => {
    try {
        const { rooms } = req.body;
        
        for (const room of rooms) {
            await db.query(
                'INSERT INTO rooms (name, type, start_time, end_time, available_days) VALUES (?, ?, ?, ?, ?)',
                [room.name, room.type, room.start_time || '07:00:00', room.end_time || '21:00:00', room.available_days || 'Mon,Tue,Wed,Thu,Fri,Sat']
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/rooms', async (req, res) => {
    try {
        const [rooms] = await db.query('SELECT * FROM rooms ORDER BY type, name');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/rooms/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/schedules/generate', async (req, res) => {
    try {
        const [sections] = await db.query(`
            SELECT s.*, p.code as program_code
            FROM sections s
            JOIN programs p ON s.program_id = p.id
        `);
        
        const [courses] = await db.query(`
            SELECT c.*, p.code as program_code
            FROM courses c
            JOIN programs p ON c.program_id = p.id
        `);
        
        const [rooms] = await db.query('SELECT * FROM rooms');
        
        if (sections.length === 0 || courses.length === 0 || rooms.length === 0) {
            return res.status(400).json({ 
                error: 'Missing required data. Please ensure sections, courses, and rooms are configured.' 
            });
        }
        
        await db.query('DELETE FROM schedules');
        
        const generator = new ScheduleGenerator();
        const result = generator.generateSchedules(sections, courses, rooms);
        
        for (const schedule of result.schedules) {
            await db.query(
                'INSERT INTO schedules (section_id, course_id, room_id, day_pattern, start_time, end_time, schedule_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [schedule.section_id, schedule.course_id, schedule.room_id, schedule.day_pattern, schedule.start_time, schedule.end_time, schedule.schedule_type]
            );
        }
        
        res.json({ 
            success: true, 
            schedulesGenerated: result.schedules.length,
            conflicts: result.conflicts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/schedules', async (req, res) => {
    try {
        const [schedules] = await db.query(`
            SELECT 
                sch.*,
                c.code as course_code,
                c.name as course_name,
                c.type as course_type,
                s.year_level,
                s.letter as section_letter,
                p.code as program_code,
                r.name as room_name,
                r.type as room_type
                FROM schedules sch
                JOIN courses c ON sch.course_id = c.id
                JOIN sections s ON sch.section_id = s.id
                JOIN programs p ON s.program_id = p.id
                JOIN rooms r ON sch.room_id = r.id
                ORDER BY p.code, s.year_level, s.letter, sch.day_pattern, sch.start_time
            `);
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/schedules/by-section/:sectionId', async (req, res) => {
    try {
        const [schedules] = await db.query(`
            SELECT 
                sch.*,
                c.code as course_code,
                c.name as course_name,
                r.name as room_name
                FROM schedules sch
                JOIN courses c ON sch.course_id = c.id
                JOIN rooms r ON sch.room_id = r.id
                WHERE sch.section_id = ?
                ORDER BY sch.day_pattern, sch.start_time
            `, [req.params.sectionId]);
            res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/schedules/by-room/:roomId', async (req, res) => {
    try {
        const [schedules] = await db.query(`
            SELECT 
                sch.*,
                c.code as course_code,
                c.name as course_name,
                s.year_level,
                s.letter as section_letter,
                p.code as program_code
                FROM schedules sch
                JOIN courses c ON sch.course_id = c.id
                JOIN sections s ON sch.section_id = s.id
                JOIN programs p ON s.program_id = p.id
                WHERE sch.room_id = ?
                ORDER BY sch.day_pattern, sch.start_time
            `, [req.params.roomId]);
            res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
