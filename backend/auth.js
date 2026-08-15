const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('./database');

const SECRET_KEY = 'your-secret-key-swiss-knife-2026';

// تسجيل مستخدم جديد
const register = async (req, res) => {
    const { username, email, password } = req.body;

    // التحقق من وجود البيانات
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إدخال المستخدم في قاعدة البيانات
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) RETURNING id, username, email`,
            [username, email, hashedPassword]
        );

        const user = result.rows[0];

        // إنشاء token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            user: { id: user.id, username: user.username, email: user.email },
            token
        });
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Username or email already exists' });
        } else {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// تسجيل الدخول
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // البحث عن المستخدم
        const result = await pool.query(
            `SELECT id, username, email, password_hash FROM users WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];

        // التحقق من كلمة المرور
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // تحديث حالة المستخدم (متصل)
        await pool.query(`UPDATE users SET is_online = true WHERE id = $1`, [user.id]);

        // إنشاء token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            user: { id: user.id, username: user.username, email: user.email },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// التحقق من صحة token (Middleware)
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
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// الحصول على معلومات المستخدم الحالي
const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, is_online, created_at FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// تسجيل الخروج
const logout = async (req, res) => {
    try {
        await pool.query(`UPDATE users SET is_online = false WHERE id = $1`, [req.user.id]);
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login, verifyToken, getMe, logout };