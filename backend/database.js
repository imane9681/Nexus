const { Pool } = require('pg');
require('dotenv').config();

// إعدادات متقدمة لقاعدة البيانات
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'swissknife',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// ==================== إنشاء جميع الجداول ====================
const createTables = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. جدول المستخدمين
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar TEXT,
                bio TEXT,
                is_online BOOLEAN DEFAULT false,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "users" ready');

        // 2. جدول الغرف
        await client.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                icon VARCHAR(10),
                created_by INTEGER REFERENCES users(id),
                is_private BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "rooms" ready');

        // 3. جدول الرسائل
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                username VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                room_id INTEGER REFERENCES rooms(id) DEFAULT 1,
                reply_to INTEGER REFERENCES messages(id),
                is_edited BOOLEAN DEFAULT false,
                is_deleted BOOLEAN DEFAULT false,
                is_pinned BOOLEAN DEFAULT false,
                attachments TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "messages" ready');

        // 4. جدول النسخ الاحتياطي
        await client.query(`
            CREATE TABLE IF NOT EXISTS backups (
                id SERIAL PRIMARY KEY,
                message_id INTEGER REFERENCES messages(id),
                content_snapshot TEXT NOT NULL,
                backed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "backups" ready');

        // 5. جدول المهام
        await client.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'todo',
                priority VARCHAR(10) DEFAULT 'medium',
                due_date TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                assigned_to INTEGER REFERENCES users(id),
                room_id INTEGER REFERENCES rooms(id),
                event_id INTEGER,
                task_status VARCHAR(20) DEFAULT 'active',
                deleted_at TIMESTAMP,
                reminder_sent BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "tasks" ready');

        // 6. جدول سجل المهام
        await client.query(`
            CREATE TABLE IF NOT EXISTS task_activity_log (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id),
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(50),
                old_value TEXT,
                new_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "task_activity_log" ready');

        // 7. جدول سلة المحذوفات
        await client.query(`
            CREATE TABLE IF NOT EXISTS task_trash (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id),
                deleted_by INTEGER REFERENCES users(id),
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
            )
        `);
        console.log('[OK] Table "task_trash" ready');

        // 8. جدول الأحداث (Calendar)
        await client.query(`
            CREATE TABLE IF NOT EXISTS calendar_events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP,
                all_day BOOLEAN DEFAULT false,
                color VARCHAR(20) DEFAULT '#3b82f6',
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "calendar_events" ready');

        // 9. جدول الملفات
        await client.query(`
            CREATE TABLE IF NOT EXISTS files (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                mime_type VARCHAR(100),
                folder VARCHAR(100) DEFAULT '/',
                uploaded_by INTEGER REFERENCES users(id),
                room_id INTEGER REFERENCES rooms(id),
                task_id INTEGER REFERENCES tasks(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "files" ready');

        // 10. جدول الإشعارات
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                type VARCHAR(50) NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                data JSONB,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "notifications" ready');

        // 11. جدول إعدادات المستخدم
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) UNIQUE,
                theme VARCHAR(20) DEFAULT 'light',
                notifications_enabled BOOLEAN DEFAULT true,
                email_notifications BOOLEAN DEFAULT true,
                language VARCHAR(10) DEFAULT 'en',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[OK] Table "user_settings" ready');

        // 12. جدول المحادثات المباشرة
        await client.query(`
            CREATE TABLE IF NOT EXISTS direct_messages (
                id SERIAL PRIMARY KEY,
                user1_id INTEGER REFERENCES users(id),
                user2_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user1_id, user2_id)
            )
        `);
        console.log('[OK] Table "direct_messages" ready');

        // 13. إضافة الغرف الافتراضية (بدون بيانات تجريبية - فقط الهيكل)
        await client.query(`
            INSERT INTO rooms (name, description, icon) VALUES 
            ('general', 'General discussions for everyone', '💬'),
            ('random', 'Random topics and fun conversations', '🎲'),
            ('tech', 'Technology, programming and coding', '💻'),
            ('gaming', 'Video games and gaming discussions', '🎮')
            ON CONFLICT (name) DO NOTHING
        `);
        console.log('[OK] Default rooms structure added');

        // 14. إضافة الفهارس لتحسين الأداء
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
            CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);
            CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
            CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
            CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
            CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_backups_message_id ON backups(message_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
            CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
            CREATE INDEX IF NOT EXISTS idx_tasks_task_status ON tasks(task_status);
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
            CREATE INDEX IF NOT EXISTS idx_events_start_date ON calendar_events(start_date);
            CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
            CREATE INDEX IF NOT EXISTS idx_task_trash_expires_at ON task_trash(expires_at);
        `);
        console.log('[OK] Indexes created');

        // 15. إضافة دالة لتحديث updated_at تلقائياً
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        // 16. إضافة triggers
        await client.query(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
            CREATE TRIGGER update_messages_updated_at
                BEFORE UPDATE ON messages
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
            CREATE TRIGGER update_tasks_updated_at
                BEFORE UPDATE ON tasks
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_events_updated_at ON calendar_events;
            CREATE TRIGGER update_events_updated_at
                BEFORE UPDATE ON calendar_events
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

        console.log('[OK] Triggers created');

        await client.query('COMMIT');
        console.log('[SUCCESS] All tables created successfully!');
        console.log('[INFO] Database is ready for real data only - no demo data inserted');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[ERROR] Creating tables:', error.message);
    } finally {
        client.release();
    }
};

// ==================== اختبار الاتصال ====================
const testConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW() as time, version() as version');
        console.log('[OK] Database connected successfully!');
        console.log(`      PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
        console.log(`      Server Time: ${result.rows[0].time}`);
        return true;
    } catch (error) {
        console.error('[ERROR] Database connection failed:', error.message);
        return false;
    }
};

// ==================== الحصول على إحصائيات قاعدة البيانات ====================
const getDatabaseStats = async () => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM messages) as total_messages,
                (SELECT COUNT(*) FROM tasks) as total_tasks,
                (SELECT COUNT(*) FROM files) as total_files,
                (SELECT COUNT(*) FROM notifications) as total_notifications,
                (SELECT COUNT(*) FROM rooms) as total_rooms,
                (SELECT COUNT(*) FROM backups) as total_backups,
                pg_database_size(current_database()) as db_size_bytes,
                pg_size_pretty(pg_database_size(current_database())) as db_size_pretty
        `);
        return result.rows[0];
    } catch (error) {
        console.error('[ERROR] Getting database stats:', error);
        return null;
    }
};

// ==================== تنظيف قاعدة البيانات (مع الحفاظ على المستخدمين) ====================
const cleanDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // حذف جميع البيانات (مع الحفاظ على المستخدمين)
        await client.query('DELETE FROM notifications');
        await client.query('DELETE FROM files');
        await client.query('DELETE FROM task_activity_log');
        await client.query('DELETE FROM task_trash');
        await client.query('DELETE FROM tasks');
        await client.query('DELETE FROM calendar_events');
        await client.query('DELETE FROM backups');
        await client.query('DELETE FROM messages');
        await client.query('DELETE FROM direct_messages');
        await client.query('DELETE FROM user_settings');
        
        // إعادة تعيين التسلسلات
        await client.query('ALTER SEQUENCE messages_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE backups_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE tasks_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE task_trash_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE task_activity_log_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE calendar_events_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE files_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE notifications_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE user_settings_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE direct_messages_id_seq RESTART WITH 1');
        
        // إعادة تعيين حالة المستخدمين
        await client.query('UPDATE users SET is_online = false, last_seen = CURRENT_TIMESTAMP');
        
        await client.query('COMMIT');
        console.log('[OK] Database cleaned successfully (users preserved)');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[ERROR] Cleaning database:', error.message);
        return false;
    } finally {
        client.release();
    }
};

// ==================== تنظيف كامل (مع حذف المستخدمين) ====================
const cleanDatabaseFull = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // حذف جميع البيانات
        await client.query('DELETE FROM notifications');
        await client.query('DELETE FROM files');
        await client.query('DELETE FROM task_activity_log');
        await client.query('DELETE FROM task_trash');
        await client.query('DELETE FROM tasks');
        await client.query('DELETE FROM calendar_events');
        await client.query('DELETE FROM backups');
        await client.query('DELETE FROM messages');
        await client.query('DELETE FROM direct_messages');
        await client.query('DELETE FROM user_settings');
        await client.query('DELETE FROM users');
        
        // إعادة تعيين التسلسلات
        await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE rooms_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE messages_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE backups_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE tasks_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE task_trash_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE task_activity_log_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE calendar_events_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE files_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE notifications_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE user_settings_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE direct_messages_id_seq RESTART WITH 1');
        
        // إعادة إنشاء الغرف الافتراضية
        await client.query(`
            INSERT INTO rooms (name, description, icon) VALUES 
            ('general', 'General discussions for everyone', '💬'),
            ('random', 'Random topics and fun conversations', '🎲'),
            ('tech', 'Technology, programming and coding', '💻'),
            ('gaming', 'Video games and gaming discussions', '🎮')
            ON CONFLICT (name) DO NOTHING
        `);
        
        await client.query('COMMIT');
        console.log('[OK] Database fully cleaned (users deleted)');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[ERROR] Cleaning database:', error.message);
        return false;
    } finally {
        client.release();
    }
};

// ==================== تصدير الوحدات ====================
module.exports = {
    pool,
    createTables,
    testConnection,
    getDatabaseStats,
    cleanDatabase,      // يحافظ على المستخدمين
    cleanDatabaseFull   // يحذف كل شيء بما فيهم المستخدمين
};