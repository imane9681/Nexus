const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const { pool } = require('./database');
const { createBackup, getBackupsByMessageId, restoreMessage } = require('./backup');
const tasks = require('./tasks');
const cron = require('node-cron');
const notifications = require('./notifications');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const SECRET_KEY = 'your-secret-key-swiss-knife-2026';
const processedMessages = new Set();

// ========== verifyToken Middleware ==========
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ========== الحذف التلقائي للمهام القديمة ==========
cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running auto cleanup...');
    const count = await tasks.autoCleanupTrash();
    console.log(`✅ Auto cleanup completed: ${count} tasks permanently deleted`);
});

// ========== الحذف التلقائي للرسائل المحذوفة بعد 30 يوماً ==========
cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Running permanent deletion of old deleted messages...');
    const result = await pool.query(
        `DELETE FROM messages 
         WHERE is_deleted = true 
         AND created_at < NOW() - INTERVAL '30 days'
         RETURNING id`
    );
    console.log(`✅ Permanently deleted ${result.rows.length} old messages`);
});

// ========== المسارات الأساسية ==========
app.get('/', (req, res) => {
    res.send('Swiss Knife Server is running!');
});

// ========== مسارات المصادقة ==========
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email`,
            [username, email, hashedPassword]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
        res.status(201).json({ message: 'User created successfully', user, token });
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Username or email already exists' });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(`SELECT id, username, email, password_hash FROM users WHERE username = $1`, [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        await pool.query(`UPDATE users SET is_online = true WHERE id = $1`, [user.id]);
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email }, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, username, email, is_online, created_at FROM users WHERE id = $1`, [req.user.id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/logout', verifyToken, async (req, res) => {
    await pool.query(`UPDATE users SET is_online = false WHERE id = $1`, [req.user.id]);
    res.json({ message: 'Logout successful' });
});

// ========== مسارات المستخدمين ==========
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email FROM users WHERE id != $1 ORDER BY username`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ========== مسارات الغرف ==========
app.get('/api/rooms', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, COUNT(DISTINCT m.id) as message_count
            FROM rooms r
            LEFT JOIN messages m ON m.room_id = r.id AND m.is_deleted = false
            GROUP BY r.id
            ORDER BY r.name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

app.post('/api/rooms', verifyToken, async (req, res) => {
    const { name, description } = req.body;
    if (!name || name.length < 3) {
        return res.status(400).json({ error: 'Room name must be at least 3 characters' });
    }
    try {
        // أضف is_deleted = false في الـ INSERT
        const result = await pool.query(
            `INSERT INTO rooms (name, description, created_by, is_deleted) VALUES ($1, $2, $3, false) RETURNING *`,
            [name.toLowerCase(), description || '', req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating room:', error);
        if (error.code === '23505') {
            res.status(400).json({ error: 'Room already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create room: ' + error.message });
        }
    }
});

// ========== مسار حذف الغرفة ==========
// أضف هذا بعد مسار POST /api/rooms
app.delete('/api/rooms/:roomId', verifyToken, async (req, res) => {
    const { roomId } = req.params;
    const PROTECTED_ROOMS = ['general', 'random', 'tech', 'gaming'];
    
    try {
        // جلب معلومات الغرفة
        const roomResult = await pool.query(
            `SELECT name, created_by FROM rooms WHERE id = $1 AND is_deleted = false`,
            [roomId]
        );
        
        if (roomResult.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        const room = roomResult.rows[0];
        
        // حماية الغرف الافتراضية
        if (PROTECTED_ROOMS.includes(room.name)) {
            return res.status(403).json({ 
                error: '❌ Cannot delete default rooms (general, random, tech, gaming)' 
            });
        }
        
        // التحقق من صلاحيات الحذف (المالك فقط أو المسؤول)
        if (room.created_by !== req.user.id) {
            return res.status(403).json({ error: 'Only room creator can delete this room' });
        }
        
        // نقل الرسائل إلى غرفة general (الغرفة رقم 1)
        await pool.query(
            `UPDATE messages SET room_id = 1 WHERE room_id = $1`,
            [roomId]
        );
        
        // نقل المهام المرتبطة بالغرفة
        await pool.query(
            `UPDATE tasks SET room_id = 1 WHERE room_id = $1`,
            [roomId]
        );
        
        // حذف الغرفة (soft delete أو hard delete)
        await pool.query(
            `DELETE FROM rooms WHERE id = $1`,
            [roomId]
        );
        
        // إعلام جميع المستخدمين عبر Socket.io
        io.emit('room-deleted', { 
            roomId: parseInt(roomId), 
            defaultRoomId: 1,
            roomName: room.name 
        });
        
        res.json({ 
            success: true, 
            message: `✅ Room "#${room.name}" deleted successfully`,
            defaultRoomId: 1
        });
        
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

app.get('/api/rooms/:roomId/messages', verifyToken, async (req, res) => {
    const { roomId } = req.params;
    const { limit = 100 } = req.query;
    try {
        const result = await pool.query(
            `SELECT id, username, content, created_at, user_id 
             FROM messages 
             WHERE room_id = $1 AND is_deleted = false 
             ORDER BY created_at ASC 
             LIMIT $2`,
            [roomId, limit]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// ========== مسارات أعضاء الغرفة ==========
app.get('/api/rooms/:roomId/members', verifyToken, async (req, res) => {
    const { roomId } = req.params;
    try {
        const result = await pool.query(`
            SELECT DISTINCT u.id, u.username, u.email, u.avatar_url, u.is_online, u.last_seen
            FROM users u
            JOIN messages m ON u.id = m.user_id
            WHERE m.room_id = $1
            ORDER BY u.is_online DESC, u.username ASC
        `, [roomId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});



// ========== مسارات إعدادات المستخدم ==========
app.get('/api/user/settings', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT us.*, u.username, u.email, u.avatar_url, u.bio
            FROM user_settings us
            JOIN users u ON us.user_id = u.id
            WHERE us.user_id = $1
        `, [req.user.id]);
        res.json(result.rows[0] || {});
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.put('/api/user/settings', verifyToken, async (req, res) => {
    const { theme, notifications_enabled, email_notifications, language, bio, avatar_url } = req.body;
    try {
        // التأكد من وجود إعدادات للمستخدم
        const checkSettings = await pool.query(`SELECT * FROM user_settings WHERE user_id = $1`, [req.user.id]);
        if (checkSettings.rows.length === 0) {
            await pool.query(
                `INSERT INTO user_settings (user_id, theme, notifications_enabled, email_notifications, language) VALUES ($1, $2, $3, $4, $5)`,
                [req.user.id, theme || 'light', notifications_enabled !== false, email_notifications !== false, language || 'en']
            );
        } else {
            await pool.query(`
                UPDATE user_settings 
                SET theme = COALESCE($1, theme),
                    notifications_enabled = COALESCE($2, notifications_enabled),
                    email_notifications = COALESCE($3, email_notifications),
                    language = COALESCE($4, language),
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $5
            `, [theme, notifications_enabled, email_notifications, language, req.user.id]);
        }
        
        await pool.query(`
            UPDATE users 
            SET bio = COALESCE($1, bio),
                avatar_url = COALESCE($2, avatar_url)
            WHERE id = $3
        `, [bio, avatar_url, req.user.id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ========== مسارات Time Travel ==========
app.get('/api/messages/history', verifyToken, async (req, res) => {
    try {
        const { limit = 50, roomId, includeDeleted = 'true' } = req.query;
        let query = `
            SELECT m.id, m.username, m.content, m.created_at, m.user_id,
                   COUNT(b.id) as backup_count,
                   m.is_deleted
            FROM messages m
            LEFT JOIN backups b ON m.id = b.message_id
        `;
        const params = [];
        
        if (roomId) {
            query += ` WHERE m.room_id = $${params.length + 1}`;
            params.push(roomId);
        } else {
            query += ` WHERE 1=1`;
        }
        
        if (includeDeleted === 'false') {
            query += ` AND m.is_deleted = false`;
        }
        
        query += ` GROUP BY m.id ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.get('/api/backups/:messageId', verifyToken, async (req, res) => {
    const { messageId } = req.params;
    const backups = await getBackupsByMessageId(messageId);
    res.json(backups);
});

app.post('/api/restore/:backupId', verifyToken, async (req, res) => {
    const { backupId } = req.params;
    const result = await restoreMessage(backupId);
    if (result.error) {
        res.status(400).json(result);
    } else {
        io.emit('message-restored', { 
            messageId: result.messageId, 
            restoredContent: result.restoredContent 
        });
        res.json(result);
    }
});

app.get('/api/timeline/stats', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(DISTINCT m.id) as total_messages,
                COUNT(b.id) as total_backups,
                COUNT(DISTINCT CASE WHEN m.created_at > NOW() - INTERVAL '1 day' THEN m.id END) as messages_today
            FROM messages m
            LEFT JOIN backups b ON m.id = b.message_id
            WHERE m.user_id = $1
        `, [req.user.id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ========== مسارات Dashboard ==========
app.get('/api/stats/server', verifyToken, async (req, res) => {
    try {
        const onlineUsers = await pool.query(`SELECT COUNT(*) FROM users WHERE is_online = true`);
        const todayMessages = await pool.query(`SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '1 day' AND is_deleted = false`);
        const totalBackups = await pool.query(`SELECT COUNT(*) FROM backups`);
        const recentMessages = await pool.query(`
            SELECT m.username, m.content, m.created_at, m.room_id, r.name as room_name
            FROM messages m
            LEFT JOIN rooms r ON m.room_id = r.id
            WHERE m.is_deleted = false 
            ORDER BY m.created_at DESC 
            LIMIT 10
        `);
        res.json({
            onlineUsers: parseInt(onlineUsers.rows[0].count),
            todayMessages: parseInt(todayMessages.rows[0].count),
            totalBackups: parseInt(totalBackups.rows[0].count),
            recentMessages: recentMessages.rows,
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('Error fetching server stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/stats/messages-distribution', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.name as room_name, COUNT(m.id) as message_count
            FROM messages m
            JOIN rooms r ON m.room_id = r.id
            WHERE m.is_deleted = false
            GROUP BY r.id, r.name
            ORDER BY message_count DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching messages distribution:', error);
        res.status(500).json({ error: 'Failed to fetch distribution' });
    }
});

app.get('/api/stats/user', verifyToken, async (req, res) => {
    try {
        const userMessages = await pool.query(`SELECT COUNT(*) FROM messages WHERE user_id = $1 AND is_deleted = false`, [req.user.id]);
        const userBackups = await pool.query(`
            SELECT COUNT(b.id) FROM backups b
            JOIN messages m ON b.message_id = m.id
            WHERE m.user_id = $1
        `, [req.user.id]);
        
        const activity = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM messages
            WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days' AND is_deleted = false
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [req.user.id]);
        
        res.json({
            totalMessages: parseInt(userMessages.rows[0].count),
            totalBackups: parseInt(userBackups.rows[0].count),
            activity: activity.rows
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/stats/user-activity', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                EXTRACT(DOW FROM created_at) as day_of_week
            FROM messages
            WHERE user_id = $1 
                AND created_at > NOW() - INTERVAL '30 days'
                AND is_deleted = false
            GROUP BY DATE(created_at), EXTRACT(DOW FROM created_at)
            ORDER BY date ASC
        `, [req.user.id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

app.get('/api/stats/ping', verifyToken, async (req, res) => {
    const start = Date.now();
    await pool.query('SELECT 1');
    const dbTime = Date.now() - start;
    res.json({ serverTime: dbTime, dbTime, timestamp: new Date().toISOString() });
});

// ========== مسارات المهام الأساسية ==========
app.get('/api/tasks', verifyToken, async (req, res) => {
    const { filter = 'active', page = 1, limit = 20, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const result = await tasks.getTasks(req.user.id, filter, parseInt(page), parseInt(limit), search, sortBy, sortOrder);
    res.json(result);
});

app.post('/api/tasks', verifyToken, async (req, res) => {
    const { title, description, priority, due_date, assigned_to, room_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const newTask = await tasks.createTask({ title, description, priority: priority || 'medium', due_date, assigned_to, room_id, created_by: req.user.id });
    io.emit('task-created', newTask);
    res.status(201).json(newTask);
});

app.patch('/api/tasks/:id/status', verifyToken, async (req, res) => {
    const { status } = req.body;
    const updated = await tasks.updateTaskStatus(req.params.id, status, req.user.id);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    io.emit('task-updated', updated);
    res.json(updated);
});

app.put('/api/tasks/:id', verifyToken, async (req, res) => {
    const { title, description, priority, due_date, assigned_to } = req.body;
    const updated = await tasks.updateTask(req.params.id, { title, description, priority, due_date, assigned_to }, req.user.id);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    io.emit('task-updated', updated);
    res.json(updated);
});

app.delete('/api/tasks/:id', verifyToken, async (req, res) => {
    const deleted = await tasks.deleteTask(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    io.emit('task-deleted', { id: req.params.id });
    res.json({ success: true });
});

app.post('/api/messages/:id/convert-to-task', verifyToken, async (req, res) => {
    const newTask = await tasks.createTaskFromMessage(req.params.id, req.user.id);
    if (!newTask) return res.status(404).json({ error: 'Message not found' });
    io.emit('task-created', newTask);
    res.status(201).json(newTask);
});

app.delete('/api/messages/:messageId', verifyToken, async (req, res) => {
    const { messageId } = req.params;
    try {
        await pool.query(`UPDATE messages SET is_deleted = true WHERE id = $1 AND user_id = $2`, [messageId, req.user.id]);
        io.emit('message-deleted', { messageId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// ========== مسارات إحصائيات المهام ==========
app.get('/api/tasks/stats', verifyToken, async (req, res) => {
    const stats = await tasks.getTaskStats(req.user.id);
    res.json(stats);
});

app.post('/api/tasks/:id/archive', verifyToken, async (req, res) => {
    const archived = await tasks.archiveTask(req.params.id, req.user.id);
    if (!archived) return res.status(404).json({ error: 'Task not found' });
    io.emit('task-archived', archived);
    res.json(archived);
});

app.post('/api/tasks/:id/unarchive', verifyToken, async (req, res) => {
    const unarchived = await tasks.unarchiveTask(req.params.id, req.user.id);
    if (!unarchived) return res.status(404).json({ error: 'Task not found' });
    io.emit('task-unarchived', unarchived);
    res.json(unarchived);
});

app.delete('/api/tasks/:id/soft', verifyToken, async (req, res) => {
    const deleted = await tasks.softDeleteTask(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    io.emit('task-soft-deleted', deleted);
    res.json(deleted);
});

app.post('/api/tasks/:id/restore', verifyToken, async (req, res) => {
    const restored = await tasks.restoreTask(req.params.id, req.user.id);
    if (!restored) return res.status(404).json({ error: 'Task not found' });
    io.emit('task-restored', restored);
    res.json(restored);
});

app.delete('/api/tasks/:id/permanent', verifyToken, async (req, res) => {
    const deleted = await tasks.permanentDeleteTask(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    io.emit('task-permanently-deleted', { id: req.params.id });
    res.json({ success: true });
});

// ========== مسارات التقويم ==========
const calendar = require('./calendar');

app.get('/api/calendar/events', verifyToken, async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'start and end dates are required' });
    const events = await calendar.getEvents(req.user.id, start, end);
    res.json(events);
});

app.post('/api/calendar/events', verifyToken, async (req, res) => {
    const { title, description, start_date, end_date, all_day, color } = req.body;
    if (!title || !start_date) return res.status(400).json({ error: 'Title and start date are required' });
    const newEvent = await calendar.createEvent({ title, description, start_date, end_date, all_day, color, created_by: req.user.id });
    res.status(201).json(newEvent);
});

app.put('/api/calendar/events/:id', verifyToken, async (req, res) => {
    const { title, description, start_date, end_date, all_day, color } = req.body;
    const updated = await calendar.updateEvent(req.params.id, req.user.id, { title, description, start_date, end_date, all_day, color });
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
});

app.delete('/api/calendar/events/:id', verifyToken, async (req, res) => {
    const deleted = await calendar.deleteEvent(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
});

app.post('/api/tasks/:taskId/link-to-event/:eventId', verifyToken, async (req, res) => {
    const linked = await calendar.linkTaskToEvent(req.params.taskId, req.params.eventId, req.user.id);
    if (!linked) return res.status(404).json({ error: 'Task or event not found' });
    res.json(linked);
});

// ========== مسارات إدارة الملفات ==========
const fileManager = require('./fileManager');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// إعدادات رفع الملفات
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
}).single('file');

app.post('/api/files/upload', verifyToken, (req, res) => {
    fileUpload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { folder, room_id, task_id } = req.body;
        
        try {
            const result = await pool.query(
                `INSERT INTO files (filename, original_name, file_path, file_size, mime_type, folder, uploaded_by, room_id, task_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                 RETURNING *`,
                [req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, folder || '/', req.user.id, room_id || null, task_id || null]
            );
            
            if (room_id) {
                const roomUsers = await pool.query(`SELECT DISTINCT user_id FROM messages WHERE room_id = $1`, [room_id]);
                for (const user of roomUsers.rows) {
                    if (user.user_id !== req.user.id) {
                        await notifications.createNotification(
                            user.user_id,
                            'file',
                            `New File: ${req.file.originalname}`,
                            `${req.user.username} uploaded a file`,
                            { file_id: result.rows[0].id, room_id }
                        );
                    }
                }
            }
            
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error saving file:', error);
            res.status(500).json({ error: 'Failed to save file' });
        }
    });
});

app.get('/api/files/:id/download', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const result = await pool.query(`SELECT * FROM files WHERE id = $1`, [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'File not found' });
        res.download(result.rows[0].file_path, result.rows[0].original_name);
    } catch (error) {
        res.status(500).json({ error: 'Failed to download file' });
    }
});

app.get('/api/files', verifyToken, async (req, res) => {
    const { folder = '/', limit = 50, offset = 0, search = '' } = req.query;
    try {
        let query = `
            SELECT f.*, u.username as uploaded_by_name
            FROM files f
            LEFT JOIN users u ON f.uploaded_by = u.id
            WHERE f.uploaded_by = $1 AND f.folder = $2
        `;
        const params = [req.user.id, folder];
        
        if (search) {
            query += ` AND f.original_name ILIKE $3`;
            params.push(`%${search}%`);
        }
        
        query += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM files WHERE uploaded_by = $1 AND folder = $2`,
            [req.user.id, folder]
        );
        
        const foldersResult = await pool.query(
            `SELECT DISTINCT folder FROM files WHERE uploaded_by = $1 AND folder != '/' ORDER BY folder`,
            [req.user.id]
        );
        
        res.json({
            files: result.rows,
            folders: foldersResult.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// جلب جميع المجلدات
app.get('/api/folders/all', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT folder FROM files WHERE uploaded_by = $1 ORDER BY folder`,
            [req.user.id]
        );
        
        const folders = result.rows;
        if (!folders.some(f => f.folder === '/')) {
            folders.unshift({ folder: '/' });
        }
        
        const foldersWithStats = await Promise.all(folders.map(async (folder) => {
            const countResult = await pool.query(
                `SELECT COUNT(*) as count FROM files WHERE uploaded_by = $1 AND folder = $2 AND original_name NOT LIKE '%.folder'`,
                [req.user.id, folder.folder]
            );
            return {
                ...folder,
                fileCount: parseInt(countResult.rows[0].count)
            };
        }));
        
        res.json(foldersWithStats);
    } catch (error) {
        console.error('Error fetching all folders:', error);
        res.status(500).json({ error: 'Failed to fetch folders' });
    }
});

// جلب جميع الملفات
app.get('/api/files/all', verifyToken, async (req, res) => {
    const { limit = 50, offset = 0, search = '' } = req.query;
    try {
        let query = `
            SELECT f.*, u.username as uploaded_by_name
            FROM files f
            LEFT JOIN users u ON f.uploaded_by = u.id
            WHERE f.uploaded_by = $1
        `;
        const params = [req.user.id];
        
        if (search) {
            query += ` AND f.original_name ILIKE $2`;
            params.push(`%${search}%`);
        }
        
        query += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM files WHERE uploaded_by = $1`,
            [req.user.id]
        );
        
        res.json({
            files: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching all files:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

app.get('/api/files/stats', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT SUM(file_size) as total_size, COUNT(*) as total_files FROM files WHERE uploaded_by = $1`,
            [req.user.id]
        );
        res.json({
            totalSize: parseInt(result.rows[0].total_size) || 0,
            totalFiles: parseInt(result.rows[0].total_files) || 0,
            maxStorage: 100 * 1024 * 1024
        });
    } catch (error) {
        console.error('Error fetching storage stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.delete('/api/files/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`SELECT * FROM files WHERE id = $1 AND uploaded_by = $2`, [id, req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const file = result.rows[0];
        if (fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
        }
        
        await pool.query(`DELETE FROM files WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

app.delete('/api/files/delete-folder', verifyToken, async (req, res) => {
    const { folder } = req.query;
    try {
        const filesToDelete = await pool.query(`SELECT file_path FROM files WHERE uploaded_by = $1 AND folder = $2`, [req.user.id, folder]);
        for (const file of filesToDelete.rows) {
            if (fs.existsSync(file.file_path)) {
                fs.unlinkSync(file.file_path);
            }
        }
        
        await pool.query(`DELETE FROM files WHERE uploaded_by = $1 AND folder = $2`, [req.user.id, folder]);
        res.json({ success: true, message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

app.put('/api/files/:id/move', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { targetFolder } = req.body;
    
    if (!targetFolder) {
        return res.status(400).json({ error: 'Target folder is required' });
    }
    
    try {
        const fileCheck = await pool.query(
            `SELECT id, original_name FROM files WHERE id = $1 AND uploaded_by = $2`,
            [id, req.user.id]
        );
        
        if (fileCheck.rows.length === 0) {
            return res.status(404).json({ error: 'File not found or access denied' });
        }
        
        await pool.query(
            `UPDATE files SET folder = $1 WHERE id = $2 AND uploaded_by = $3`,
            [targetFolder, id, req.user.id]
        );
        
        res.json({ 
            success: true, 
            message: `File moved to ${targetFolder}`,
            newFolder: targetFolder
        });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).json({ error: 'Failed to move file' });
    }
});

app.post('/api/files/:id/move', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { targetFolder } = req.body;
    
    if (!targetFolder) {
        return res.status(400).json({ error: 'Target folder is required' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE files SET folder = $1 WHERE id = $2 AND uploaded_by = $3 RETURNING *`,
            [targetFolder, id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found or access denied' });
        }
        
        res.json({ 
            success: true, 
            file: result.rows[0],
            message: 'File moved successfully'
        });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).json({ error: 'Failed to move file' });
    }
});

// ========== حذف مجلد بالكامل مع جميع محتوياته ==========
app.delete('/api/folders/:folderPath', verifyToken, async (req, res) => {
    const { folderPath } = req.params;
    const decodedFolderPath = decodeURIComponent(folderPath);
    
    if (!decodedFolderPath || decodedFolderPath === '/') {
        return res.status(400).json({ error: 'Cannot delete root folder' });
    }
    
    try {
        // جلب جميع الملفات في المجلد
        const filesToDelete = await pool.query(
            `SELECT id, file_path FROM files WHERE uploaded_by = $1 AND folder = $2`,
            [req.user.id, decodedFolderPath]
        );
        
        // حذف الملفات الفعلية من النظام
        for (const file of filesToDelete.rows) {
            if (fs.existsSync(file.file_path)) {
                fs.unlinkSync(file.file_path);
                console.log(`🗑️ Deleted file: ${file.file_path}`);
            }
        }
        
        // حذف سجلات الملفات من قاعدة البيانات
        const deleteResult = await pool.query(
            `DELETE FROM files WHERE uploaded_by = $1 AND folder = $2 RETURNING id`,
            [req.user.id, decodedFolderPath]
        );
        
        // حذف المجلدات الفرعية أيضاً (إذا كانت موجودة)
        const subFolders = await pool.query(
            `SELECT DISTINCT folder FROM files WHERE uploaded_by = $1 AND folder LIKE $2`,
            [req.user.id, `${decodedFolderPath}/%`]
        );
        
        for (const subFolder of subFolders.rows) {
            const subFiles = await pool.query(
                `SELECT file_path FROM files WHERE uploaded_by = $1 AND folder = $2`,
                [req.user.id, subFolder.folder]
            );
            
            for (const file of subFiles.rows) {
                if (fs.existsSync(file.file_path)) {
                    fs.unlinkSync(file.file_path);
                }
            }
            
            await pool.query(
                `DELETE FROM files WHERE uploaded_by = $1 AND folder = $2`,
                [req.user.id, subFolder.folder]
            );
        }
        
        res.json({ 
            success: true, 
            message: `Folder "${decodedFolderPath}" deleted successfully`,
            filesDeleted: deleteResult.rowCount + subFolders.rows.reduce((acc, f) => acc + 1, 0)
        });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// حذف مجلد (النسخة القديمة - نحتفظ بها للتوافق)
app.delete('/api/files/delete-folder', verifyToken, async (req, res) => {
    const { folder } = req.query;
    
    if (!folder || folder === '/') {
        return res.status(400).json({ error: 'Cannot delete root folder' });
    }
    
    try {
        // جلب جميع الملفات في المجلد
        const filesToDelete = await pool.query(
            `SELECT file_path FROM files WHERE uploaded_by = $1 AND folder = $2`,
            [req.user.id, folder]
        );
        
        // حذف الملفات الفعلية
        for (const file of filesToDelete.rows) {
            if (fs.existsSync(file.file_path)) {
                fs.unlinkSync(file.file_path);
            }
        }
        
        // حذف سجلات الملفات
        await pool.query(
            `DELETE FROM files WHERE uploaded_by = $1 AND folder = $2`,
            [req.user.id, folder]
        );
        
        // حذف المجلدات الفرعية
        const subFolders = await pool.query(
            `SELECT DISTINCT folder FROM files WHERE uploaded_by = $1 AND folder LIKE $2`,
            [req.user.id, `${folder}/%`]
        );
        
        for (const subFolder of subFolders.rows) {
            const subFiles = await pool.query(
                `SELECT file_path FROM files WHERE uploaded_by = $1 AND folder = $2`,
                [req.user.id, subFolder.folder]
            );
            
            for (const file of subFiles.rows) {
                if (fs.existsSync(file.file_path)) {
                    fs.unlinkSync(file.file_path);
                }
            }
            
            await pool.query(
                `DELETE FROM files WHERE uploaded_by = $1 AND folder = $2`,
                [req.user.id, subFolder.folder]
            );
        }
        
        res.json({ success: true, message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// ========== مسارات التقارير ==========
const reports = require('./reports');

app.get('/api/reports', verifyToken, (req, res) => reports.listReports(req, res));
app.post('/api/reports/tasks', verifyToken, async (req, res) => {
    const { startDate, endDate, includeCompleted, includeArchived } = req.body;
    const result = await reports.generateTasksPDF(req.user.id, startDate, endDate, includeCompleted, includeArchived);
    res.json(result);
});
app.post('/api/reports/chat', verifyToken, async (req, res) => {
    const { roomId, startDate, endDate } = req.body;
    const result = await reports.generateChatPDF(req.user.id, roomId, startDate, endDate);
    res.json(result);
});
app.post('/api/reports/statistics', verifyToken, async (req, res) => {
    const result = await reports.generateStatisticsExcel(req.user.id);
    res.json(result);
});
app.get('/api/reports/download/:filename', async (req, res) => {
    const { filename } = req.params;
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        jwt.verify(token, SECRET_KEY);
        const filepath = path.join(__dirname, 'reports', filename);
        if (fs.existsSync(filepath)) res.download(filepath, filename);
        else res.status(404).json({ error: 'File not found' });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
app.delete('/api/reports/:filename', verifyToken, (req, res) => reports.deleteReport(req, res));

// ========== مسارات الإشعارات ==========
app.get('/api/notifications', verifyToken, async (req, res) => {
    const notificationsList = await notifications.getUserNotifications(req.user.id);
    const unreadCount = await notifications.getUnreadCount(req.user.id);
    res.json({ notifications: notificationsList, unreadCount });
});
app.patch('/api/notifications/:id/read', verifyToken, async (req, res) => {
    const result = await notifications.markAsRead(req.params.id, req.user.id);
    res.json(result);
});
app.patch('/api/notifications/read-all', verifyToken, async (req, res) => {
    await notifications.markAllAsRead(req.user.id);
    res.json({ success: true });
});
app.delete('/api/notifications/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *`, [req.params.id, req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// ========== مسارات البحث ==========
app.get('/api/search', verifyToken, async (req, res) => {
    const { q, type = 'all', limit = 20 } = req.query;
    if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    try {
        const results = {};
        
        if (type === 'all' || type === 'messages') {
            const messages = await pool.query(`
                SELECT id, username, content, created_at, 'message' as type, room_id
                FROM messages 
                WHERE user_id = $1 AND content ILIKE $2 AND is_deleted = false
                ORDER BY created_at DESC
                LIMIT $3
            `, [req.user.id, `%${q}%`, limit]);
            results.messages = messages.rows;
        }
        
        if (type === 'all' || type === 'tasks') {
            const tasks = await pool.query(`
                SELECT id, title, description, status, due_date, 'task' as type
                FROM tasks 
                WHERE created_by = $1 AND (title ILIKE $2 OR description ILIKE $2) AND task_status = 'active'
                ORDER BY created_at DESC
                LIMIT $3
            `, [req.user.id, `%${q}%`, limit]);
            results.tasks = tasks.rows;
        }
        
        if (type === 'all' || type === 'files') {
            const files = await pool.query(`
                SELECT id, original_name, file_size, mime_type, created_at, 'file' as type, folder
                FROM files 
                WHERE uploaded_by = $1 AND original_name ILIKE $2
                ORDER BY created_at DESC
                LIMIT $3
            `, [req.user.id, `%${q}%`, limit]);
            results.files = files.rows;
        }
        
        res.json(results);
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Failed to search' });
    }
});

// ========== Socket.io ==========
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username}`);
    socket.currentRoom = 1;
    await pool.query(`UPDATE users SET is_online = true WHERE id = $1`, [socket.user.id]);

    socket.on('join-room', (data) => {
        const roomId = data.roomId;
        const previousRoomId = socket.currentRoom;
        if (previousRoomId) socket.leave(`room_${previousRoomId}`);
        socket.join(`room_${roomId}`);
        socket.currentRoom = roomId;
        console.log(`${socket.user.username} joined room ${roomId}`);
        socket.emit('room-joined', { roomId });
    });

    socket.on('chat-message', async (data) => {
        const roomId = data.roomId || socket.currentRoom || 1;
        const messageKey = `${socket.user.id}_${data.text}_${Date.now()}`;
        if (processedMessages.has(messageKey)) return;
        processedMessages.add(messageKey);
        setTimeout(() => processedMessages.delete(messageKey), 2000);

        console.log(`Message from ${socket.user.username} to room ${roomId}: ${data.text}`);

        try {
            const result = await pool.query(
                `INSERT INTO messages (user_id, username, content, room_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
                [socket.user.id, socket.user.username, data.text, roomId]
            );

            const messageToSend = {
                id: result.rows[0].id,
                text: data.text,
                content: data.text,
                username: socket.user.username,
                user_id: socket.user.id,
                roomId: roomId,
                timestamp: new Date().toLocaleTimeString(),
                created_at: result.rows[0].created_at
            };

            io.to(`room_${roomId}`).emit('new-message', messageToSend);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('delete-message', async ({ messageId, roomId }) => {
        try {
            const messageResult = await pool.query(
                `SELECT content FROM messages WHERE id = $1`,
                [messageId]
            );
            
            if (messageResult.rows.length > 0) {
                await createBackup(messageId, messageResult.rows[0].content);
                console.log(`✅ Backup created for message ${messageId} before deletion`);
            }
            
            await pool.query(`UPDATE messages SET is_deleted = true WHERE id = $1`, [messageId]);
            io.to(`room_${roomId}`).emit('message-deleted', { messageId });
        } catch (error) {
            console.error('Error in delete-message:', error);
        }
    });

    socket.on('edit-message', async ({ messageId, newContent, roomId }) => {
        try {
            const messageResult = await pool.query(
                `SELECT content FROM messages WHERE id = $1 AND user_id = $2`,
                [messageId, socket.user.id]
            );
            
            if (messageResult.rows.length > 0) {
                await createBackup(messageId, messageResult.rows[0].content);
                
                await pool.query(
                    `UPDATE messages SET content = $1, is_edited = true WHERE id = $2`,
                    [newContent, messageId]
                );
                
                io.to(`room_${roomId}`).emit('message-edited', { 
                    messageId, 
                    newContent,
                    editedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error in edit-message:', error);
        }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
        socket.to(`room_${roomId}`).emit('user-typing', {
            username: socket.user.username,
            isTyping
        });
    });

    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.user.username}`);
        await pool.query(`UPDATE users SET is_online = false WHERE id = $1`, [socket.user.id]);
        io.emit('user-offline', { userId: socket.user.id });
    });
   
    socket.on('delete-room', async ({ roomId }) => {
        io.emit('room-deleted', { roomId, defaultRoomId: 1 });
    });
    
});

// ========== إنشاء مجلد التقارير إذا لم يكن موجوداً ==========
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// ========== تشغيل الخادم ==========
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
    console.log(`📄 Reports directory: ${reportsDir}`);
});