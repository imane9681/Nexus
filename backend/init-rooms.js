const { pool } = require('./database');

const initRooms = async () => {
    try {
        // إنشاء جدول الغرف
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "rooms" created');

        // إضافة أعمدة room_id إلى جدول messages إذا لم تكن موجودة
        await pool.query(`
            ALTER TABLE messages 
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES rooms(id)
        `);
        console.log('✅ Column "room_id" added to messages');

        // إضافة الغرف الافتراضية
        const defaultRooms = [
            { name: 'general', description: 'General discussions' },
            { name: 'random', description: 'Random topics' },
            { name: 'tech', description: 'Technology talk' },
            { name: 'gaming', description: 'Gaming discussions' }
        ];

        for (const room of defaultRooms) {
            await pool.query(
                `INSERT INTO rooms (name, description) 
                 VALUES ($1, $2) 
                 ON CONFLICT (name) DO NOTHING`,
                [room.name, room.description]
            );
        }
        console.log('✅ Default rooms created');

        console.log('🎉 Rooms initialization complete!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit();
    }
};

initRooms();