const { pool } = require('./database');
const { createNotification } = require('./notifications');

// الحصول على الأحداث في نطاق زمني
const getEvents = async (userId, startDate, endDate) => {
    const result = await pool.query(
        `SELECT ce.*, u.username as created_by_name
         FROM calendar_events ce
         LEFT JOIN users u ON ce.created_by = u.id
         WHERE ce.created_by = $1
         AND ce.start_date >= $2
         AND ce.start_date <= $3
         ORDER BY ce.start_date ASC`,
        [userId, startDate, endDate]
    );
    return result.rows;
};

// إنشاء حدث جديد
const createEvent = async (event) => {
    const { title, description, start_date, end_date, all_day, color, created_by } = event;
    
    const result = await pool.query(
        `INSERT INTO calendar_events (title, description, start_date, end_date, all_day, color, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [title, description, start_date, end_date, all_day || false, color || '#3b82f6', created_by]
    );
    
    return result.rows[0];
};

// تحديث حدث
const updateEvent = async (eventId, userId, updates) => {
    const fields = [];
    const values = [];
    let i = 1;
    
    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
            fields.push(`${key} = $${i}`);
            values.push(value);
            i++;
        }
    }
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    values.push(eventId, userId);
    const query = `
        UPDATE calendar_events 
        SET ${fields.join(', ')} 
        WHERE id = $${i} AND created_by = $${i+1}
        RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
};

// حذف حدث
const deleteEvent = async (eventId, userId) => {
    const result = await pool.query(
        `DELETE FROM calendar_events WHERE id = $1 AND created_by = $2 RETURNING *`,
        [eventId, userId]
    );
    return result.rows[0];
};

// ربط مهمة بحدث
const linkTaskToEvent = async (taskId, eventId, userId) => {
    const result = await pool.query(
        `UPDATE tasks SET event_id = $1 WHERE id = $2 AND (created_by = $3 OR assigned_to = $3) RETURNING *`,
        [eventId, taskId, userId]
    );
    return result.rows[0];
};

// الحصول على أحداث اليوم (للتذكيرات)
const getTodayEvents = async (userId) => {
    const result = await pool.query(
        `SELECT * FROM calendar_events 
         WHERE created_by = $1 
         AND DATE(start_date) = CURRENT_DATE
         ORDER BY start_date ASC`,
        [userId]
    );
    return result.rows;
};

module.exports = {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    linkTaskToEvent,
    getTodayEvents
};