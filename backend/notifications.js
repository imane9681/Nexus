const { pool } = require('./database');

// إنشاء إشعار جديد
const createNotification = async (userId, type, title, message, data = null) => {
    try {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, data) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [userId, type, title, message, data]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// جلب إشعارات المستخدم
const getUserNotifications = async (userId, limit = 20) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

// تحديث حالة الإشعار (مقروء)
const markAsRead = async (notificationId, userId) => {
    try {
        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE id = $1 AND user_id = $2 
             RETURNING *`,
            [notificationId, userId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return null;
    }
};

// تحديث كل الإشعارات كمقروءة
const markAllAsRead = async (userId) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1`,
            [userId]
        );
        return true;
    } catch (error) {
        console.error('Error marking all as read:', error);
        return false;
    }
};

// عدد الإشعارات غير المقروءة
const getUnreadCount = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};