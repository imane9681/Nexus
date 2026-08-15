const { pool } = require('./database');
const { createNotification } = require('./notifications');
const { sendTaskAssignedEmail } = require('./email');

// الحصول على جميع المهام لمستخدم (مع دعم الأرشفة والحذف)
const getTasks = async (userId, filter = 'all', page = 1, limit = 20, search = '', sortBy = 'created_at', sortOrder = 'DESC') => {
    const offset = (page - 1) * limit;
    
    let query = `
        SELECT t.*, 
               u1.username as created_by_name,
               u2.username as assigned_to_name,
               r.name as room_name
        FROM tasks t
        LEFT JOIN users u1 ON t.created_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        LEFT JOIN rooms r ON t.room_id = r.id
        WHERE (t.created_by = $1 OR t.assigned_to = $1)
    `;
    const params = [userId];
    let paramIndex = 2;

    // Filter by task_status (active, archived, deleted)
    if (filter === 'active') {
        query += ` AND t.task_status = 'active'`;
    } else if (filter === 'archived') {
        query += ` AND t.task_status = 'archived'`;
    } else if (filter === 'deleted') {
        query += ` AND t.task_status = 'deleted'`;
    }

    // Search
    if (search) {
        query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    // Sort
    const allowedSortFields = ['title', 'priority', 'due_date', 'created_at', 'updated_at'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
        SELECT COUNT(*) FROM tasks t
        WHERE (t.created_by = $1 OR t.assigned_to = $1)
    `;
    const countParams = [userId];
    if (filter === 'active') countQuery += ` AND t.task_status = 'active'`;
    else if (filter === 'archived') countQuery += ` AND t.task_status = 'archived'`;
    else if (filter === 'deleted') countQuery += ` AND t.task_status = 'deleted'`;
    if (search) countQuery += ` AND (t.title ILIKE $2 OR t.description ILIKE $2)`;
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return {
        tasks: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

// أرشفة مهمة
const archiveTask = async (taskId, userId) => {
    const result = await pool.query(
        `UPDATE tasks 
         SET task_status = 'archived', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND (created_by = $2 OR assigned_to = $2)
         RETURNING *`,
        [taskId, userId]
    );
    
    if (result.rows[0]) {
        // تسجيل النشاط
        await pool.query(
            `INSERT INTO task_activity_log (task_id, user_id, action) 
             VALUES ($1, $2, 'archived')`,
            [taskId, userId]
        );
    }
    
    return result.rows[0];
};

// استعادة مهمة من الأرشيف
const unarchiveTask = async (taskId, userId) => {
    const result = await pool.query(
        `UPDATE tasks 
         SET task_status = 'active', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND (created_by = $2 OR assigned_to = $2)
         RETURNING *`,
        [taskId, userId]
    );
    
    if (result.rows[0]) {
        await pool.query(
            `INSERT INTO task_activity_log (task_id, user_id, action) 
             VALUES ($1, $2, 'unarchived')`,
            [taskId, userId]
        );
    }
    
    return result.rows[0];
};

// نقل مهمة إلى سلة المحذوفات
const softDeleteTask = async (taskId, userId) => {
    const result = await pool.query(
        `UPDATE tasks 
         SET task_status = 'deleted', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND (created_by = $2 OR assigned_to = $2)
         RETURNING *`,
        [taskId, userId]
    );
    
    if (result.rows[0]) {
        await pool.query(
            `INSERT INTO task_trash (task_id, deleted_by) VALUES ($1, $2)`,
            [taskId, userId]
        );
        await pool.query(
            `INSERT INTO task_activity_log (task_id, user_id, action) 
             VALUES ($1, $2, 'deleted')`,
            [taskId, userId]
        );
    }
    
    return result.rows[0];
};

// استعادة مهمة من سلة المحذوفات
const restoreTask = async (taskId, userId) => {
    const result = await pool.query(
        `UPDATE tasks 
         SET task_status = 'active', deleted_at = NULL, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND (created_by = $2 OR assigned_to = $2)
         RETURNING *`,
        [taskId, userId]
    );
    
    if (result.rows[0]) {
        await pool.query(
            `DELETE FROM task_trash WHERE task_id = $1`,
            [taskId]
        );
        await pool.query(
            `INSERT INTO task_activity_log (task_id, user_id, action) 
             VALUES ($1, $2, 'restored')`,
            [taskId, userId]
        );
    }
    
    return result.rows[0];
};

// حذف نهائي لمهمة (من سلة المحذوفات)
const permanentDeleteTask = async (taskId, userId) => {
    const result = await pool.query(
        `DELETE FROM tasks WHERE id = $1 AND (created_by = $2 OR assigned_to = $2) RETURNING *`,
        [taskId, userId]
    );
    return result.rows[0];
};

// الحصول على إحصائيات المهام
const getTaskStats = async (userId) => {
    const result = await pool.query(`
        SELECT 
            COUNT(CASE WHEN task_status = 'active' AND status != 'done' THEN 1 END) as active_tasks,
            COUNT(CASE WHEN task_status = 'active' AND status = 'done' THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN task_status = 'archived' THEN 1 END) as archived_tasks,
            COUNT(CASE WHEN task_status = 'deleted' THEN 1 END) as deleted_tasks,
            COUNT(CASE WHEN due_date < NOW() AND task_status = 'active' AND status != 'done' THEN 1 END) as overdue_tasks
        FROM tasks
        WHERE created_by = $1 OR assigned_to = $1
    `, [userId]);
    return result.rows[0];
};

// إنشاء مهمة جديدة (محدث)
const createTask = async (task) => {
    const { title, description, priority, due_date, assigned_to, room_id, message_id, created_by } = task;
    
    const result = await pool.query(
        `INSERT INTO tasks (title, description, priority, due_date, assigned_to, room_id, message_id, created_by, task_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') 
         RETURNING *`,
        [title, description, priority, due_date, assigned_to, room_id, message_id, created_by]
    );
    
    const newTask = result.rows[0];
    
    // تسجيل النشاط
    await pool.query(
        `INSERT INTO task_activity_log (task_id, user_id, action, new_value) 
         VALUES ($1, $2, 'created', $3)`,
        [newTask.id, created_by, title]
    );
    
    // إشعارات للمستخدم المعين
    if (assigned_to && assigned_to !== created_by) {
        await createNotification(
            assigned_to,
            'task_assigned',
            `New Task: ${title}`,
            `You have been assigned a new task: "${title}"`,
            { task_id: newTask.id, assigned_by: created_by }
        );
        
        const userResult = await pool.query(`SELECT email, username FROM users WHERE id = $1`, [assigned_to]);
        if (userResult.rows.length > 0) {
            await sendTaskAssignedEmail(
                userResult.rows[0].email,
                userResult.rows[0].username,
                title,
                due_date
            );
        }
    }
    
    return newTask;
};

// تحديث حالة مهمة (محدث)
const updateTaskStatus = async (taskId, status, userId) => {
    const oldTask = await pool.query(`SELECT status FROM tasks WHERE id = $1`, [taskId]);
    const result = await pool.query(
        `UPDATE tasks 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 AND (created_by = $3 OR assigned_to = $3)
         RETURNING *`,
        [status, taskId, userId]
    );
    
    if (result.rows[0] && oldTask.rows[0]?.status !== status) {
        await pool.query(
            `INSERT INTO task_activity_log (task_id, user_id, action, old_value, new_value) 
             VALUES ($1, $2, 'status_changed', $3, $4)`,
            [taskId, userId, oldTask.rows[0]?.status, status]
        );
    }
    
    return result.rows[0];
};

// الحذف التلقائي للمهام القديمة (Cron Job)
const autoCleanupTrash = async () => {
    const result = await pool.query(`
        DELETE FROM tasks 
        WHERE task_status = 'deleted' 
        AND deleted_at < NOW() - INTERVAL '30 days'
        RETURNING id
    `);
    console.log(`Auto cleanup: ${result.rows.length} tasks permanently deleted`);
    return result.rows.length;
};

module.exports = {
    getTasks,
    getTaskStats,
    createTask,
    updateTaskStatus,
    archiveTask,
    unarchiveTask,
    softDeleteTask,
    restoreTask,
    permanentDeleteTask,
    autoCleanupTrash
};