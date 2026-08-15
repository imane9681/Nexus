const { pool } = require('./database');

// إنشاء نسخة احتياطية لرسالة
const createBackup = async (messageId, content) => {
    try {
        const result = await pool.query(
            `INSERT INTO backups (message_id, content_snapshot) 
             VALUES ($1, $2) RETURNING id, backed_up_at`,
            [messageId, content]
        );
        console.log(`✅ Backup created for message ${messageId}`);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error creating backup:', error.message);
        return null;
    }
};

// الحصول على جميع النسخ الاحتياطية لرسالة
const getBackupsByMessageId = async (messageId) => {
    try {
        const result = await pool.query(
            `SELECT id, content_snapshot, backed_up_at 
             FROM backups 
             WHERE message_id = $1 
             ORDER BY backed_up_at DESC`,
            [messageId]
        );
        return result.rows;
    } catch (error) {
        console.error('❌ Error getting backups:', error.message);
        return [];
    }
};

// الحصول على جميع النسخ الاحتياطية لفترة زمنية
const getBackupsByDateRange = async (startDate, endDate) => {
    try {
        const result = await pool.query(
            `SELECT b.*, m.username, m.content as current_content 
             FROM backups b
             JOIN messages m ON b.message_id = m.id
             WHERE b.backed_up_at BETWEEN $1 AND $2
             ORDER BY b.backed_up_at DESC`,
            [startDate, endDate]
        );
        return result.rows;
    } catch (error) {
        console.error('❌ Error getting backups by date:', error.message);
        return [];
    }
};

// استعادة رسالة من نسخة احتياطية
const restoreMessage = async (backupId) => {
    try {
        const backupResult = await pool.query(
            `SELECT message_id, content_snapshot FROM backups WHERE id = $1`,
            [backupId]
        );
        
        if (backupResult.rows.length === 0) {
            return { error: 'Backup not found' };
        }
        
        const { message_id, content_snapshot } = backupResult.rows[0];
        
        // حفظ النسخة الحالية كنسخة احتياطية جديدة
        const currentMessage = await pool.query(
            `SELECT content FROM messages WHERE id = $1`,
            [message_id]
        );
        
        if (currentMessage.rows.length > 0) {
            await createBackup(message_id, currentMessage.rows[0].content);
        }
        
        // ✅ استعادة المحتوى وإزالة علامة الحذف (بدون updated_at إذا لم يكن موجوداً)
        await pool.query(
            `UPDATE messages SET content = $1, is_deleted = false WHERE id = $2`,
            [content_snapshot, message_id]
        );
        
        return { 
            success: true, 
            message: 'Message restored successfully',
            restoredContent: content_snapshot,
            messageId: message_id
        };
    } catch (error) {
        console.error('Error restoring message:', error.message);
        return { error: error.message };
    }
};
// حذف رسالة (مع نسخ احتياطي)
const softDeleteMessage = async (messageId) => {
    try {
        // أولاً: احصل على المحتوى الحالي
        const messageResult = await pool.query(
            `SELECT content FROM messages WHERE id = $1`,
            [messageId]
        );
        
        if (messageResult.rows.length === 0) {
            return { error: 'Message not found' };
        }
        
        // أنشئ نسخة احتياطية قبل الحذف
        await createBackup(messageId, messageResult.rows[0].content);
        
        // ضع علامة محذوف (soft delete)
        await pool.query(
            `UPDATE messages SET is_deleted = true WHERE id = $1`,
            [messageId]
        );
        
        return { success: true, message: 'Message deleted (backup created)' };
    } catch (error) {
        console.error('❌ Error deleting message:', error.message);
        return { error: error.message };
    }
};

// الحصول على تاريخ المحادثة (للتايملاين)
const getMessageTimeline = async (room = 'general', days = 7) => {
    try {
        const result = await pool.query(
            `SELECT 
                m.id, m.username, m.content, m.created_at,
                COUNT(b.id) as backup_count
             FROM messages m
             LEFT JOIN backups b ON m.id = b.message_id
             WHERE m.room = $1 
                AND m.created_at > NOW() - INTERVAL '${days} days'
                AND m.is_deleted = false
             GROUP BY m.id
             ORDER BY m.created_at DESC`,
            [room]
        );
        return result.rows;
    } catch (error) {
        console.error('❌ Error getting timeline:', error.message);
        return [];
    }
};

module.exports = {
    createBackup,
    getBackupsByMessageId,
    getBackupsByDateRange,
    restoreMessage,
    softDeleteMessage,
    getMessageTimeline
};