const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

// إنشاء مجلد التقارير إذا لم يكن موجوداً
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// إنشاء تقرير المهام PDF
const generateTasksPDF = async (userId, startDate, endDate, includeCompleted = true, includeArchived = false) => {
    return new Promise(async (resolve, reject) => {
        const filename = `tasks_report_${Date.now()}.pdf`;
        const filepath = path.join(reportsDir, filename);
        
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);
        
        // Header
        doc.fontSize(25).font('Helvetica-Bold').text('Swiss Knife - Tasks Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Query tasks
        let query = `
            SELECT t.*, u1.username as created_by_name, u2.username as assigned_to_name
            FROM tasks t
            LEFT JOIN users u1 ON t.created_by = u1.id
            LEFT JOIN users u2 ON t.assigned_to = u2.id
            WHERE (t.created_by = $1 OR t.assigned_to = $1)
            AND t.created_at BETWEEN $2 AND $3
        `;
        const params = [userId, startDate, endDate];
        
        if (!includeCompleted) {
            query += ` AND t.status != 'done'`;
        }
        if (!includeArchived) {
            query += ` AND t.task_status != 'archived'`;
        }
        
        query += ` ORDER BY t.created_at DESC`;
        
        const result = await pool.query(query, params);
        const tasks = result.rows;
        
        // Summary
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
        const todoTasks = tasks.filter(t => t.status === 'todo').length;
        
        doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Tasks: ${totalTasks}`);
        doc.text(`Completed: ${completedTasks}`);
        doc.text(`In Progress: ${inProgressTasks}`);
        doc.text(`To Do: ${todoTasks}`);
        doc.moveDown();
        
        // Tasks Table
        doc.fontSize(12).font('Helvetica-Bold').text('Task Details', { underline: true });
        doc.moveDown(0.5);
        
        const tableTop = doc.y;
        let y = tableTop;
        
        // Table Headers
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Title', 50, y, { width: 150 });
        doc.text('Priority', 210, y, { width: 70 });
        doc.text('Status', 290, y, { width: 80 });
        doc.text('Assigned To', 380, y, { width: 100 });
        doc.text('Due Date', 490, y, { width: 80 });
        
        y += 15;
        doc.fontSize(8).font('Helvetica');
        
        for (const task of tasks) {
            if (y > 750) {
                doc.addPage();
                y = 50;
            }
            doc.text(task.title.substring(0, 40), 50, y, { width: 150 });
            doc.text(task.priority || 'Medium', 210, y, { width: 70 });
            doc.text(task.status, 290, y, { width: 80 });
            doc.text(task.assigned_to_name || '-', 380, y, { width: 100 });
            doc.text(task.due_date ? new Date(task.due_date).toLocaleDateString() : '-', 490, y, { width: 80 });
            y += 18;
        }
        
        doc.end();
        
        stream.on('finish', () => {
            resolve({ filename, filepath });
        });
        
        stream.on('error', reject);
    });
};

// إنشاء تقرير المحادثات PDF
const generateChatPDF = async (userId, roomId, startDate, endDate) => {
    return new Promise(async (resolve, reject) => {
        const filename = `chat_export_${Date.now()}.pdf`;
        const filepath = path.join(reportsDir, filename);
        
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);
        
        // Get room name
        const roomResult = await pool.query(`SELECT name FROM rooms WHERE id = $1`, [roomId]);
        const roomName = roomResult.rows[0]?.name || 'Chat';
        
        // Header
        doc.fontSize(25).font('Helvetica-Bold').text('Swiss Knife - Chat Export', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica');
        doc.text(`Room: #${roomName}`, { align: 'center' });
        doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Get messages
        const result = await pool.query(`
            SELECT m.*, u.username
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.room_id = $1
            AND m.created_at BETWEEN $2 AND $3
            AND m.is_deleted = false
            ORDER BY m.created_at ASC
        `, [roomId, startDate, endDate]);
        
        const messages = result.rows;
        
        doc.fontSize(10).font('Helvetica');
        
        for (const msg of messages) {
            if (doc.y > 750) {
                doc.addPage();
            }
            doc.font('Helvetica-Bold');
            doc.text(`${msg.username}`, 50, doc.y);
            doc.font('Helvetica');
            doc.text(` [${new Date(msg.created_at).toLocaleString()}]`, { continued: true });
            doc.moveDown(0.3);
            doc.text(msg.content, 70, doc.y, { width: 470 });
            doc.moveDown(0.5);
        }
        
        doc.end();
        
        stream.on('finish', () => {
            resolve({ filename, filepath });
        });
        
        stream.on('error', reject);
    });
};

// إنشاء تقرير إحصائيات Excel
const generateStatisticsExcel = async (userId) => {
    const filename = `statistics_${Date.now()}.xlsx`;
    const filepath = path.join(reportsDir, filename);
    
    const workbook = new ExcelJS.Workbook();
    
    // Tasks Sheet
    const tasksSheet = workbook.addWorksheet('Tasks');
    tasksSheet.columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Assigned To', key: 'assigned_to', width: 20 },
        { header: 'Due Date', key: 'due_date', width: 15 },
        { header: 'Created At', key: 'created_at', width: 20 }
    ];
    
    const tasksResult = await pool.query(`
        SELECT t.*, u.username as assigned_to_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.created_by = $1 OR t.assigned_to = $1
        ORDER BY t.created_at DESC
    `, [userId]);
    
    tasksResult.rows.forEach(task => {
        tasksSheet.addRow({
            title: task.title,
            priority: task.priority,
            status: task.status,
            assigned_to: task.assigned_to_name || '-',
            due_date: task.due_date ? new Date(task.due_date).toLocaleDateString() : '-',
            created_at: new Date(task.created_at).toLocaleString()
        });
    });
    
    // Messages Sheet
    const messagesSheet = workbook.addWorksheet('Messages');
    messagesSheet.columns = [
        { header: 'Room', key: 'room', width: 15 },
        { header: 'Username', key: 'username', width: 20 },
        { header: 'Content', key: 'content', width: 50 },
        { header: 'Created At', key: 'created_at', width: 20 }
    ];
    
    const messagesResult = await pool.query(`
        SELECT m.*, r.name as room_name
        FROM messages m
        JOIN rooms r ON m.room_id = r.id
        WHERE m.user_id = $1
        ORDER BY m.created_at DESC
        LIMIT 500
    `, [userId]);
    
    messagesResult.rows.forEach(msg => {
        messagesSheet.addRow({
            room: msg.room_name,
            username: msg.username,
            content: msg.content,
            created_at: new Date(msg.created_at).toLocaleString()
        });
    });
    
    await workbook.xlsx.writeFile(filepath);
    return { filename, filepath };
};

// تحميل تقرير
const downloadReport = (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(reportsDir, filename);
    
    if (fs.existsSync(filepath)) {
        res.download(filepath, filename);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
};

// حذف تقرير
const deleteReport = (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(reportsDir, filename);
    
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
};

// جلب قائمة التقارير
const listReports = (req, res) => {
    fs.readdir(reportsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to list reports' });
        }
        const reports = files.filter(f => f.endsWith('.pdf') || f.endsWith('.xlsx')).map(f => ({
            filename: f,
            size: fs.statSync(path.join(reportsDir, f)).size,
            created_at: fs.statSync(path.join(reportsDir, f)).birthtime
        }));
        res.json(reports);
    });
};

module.exports = {
    generateTasksPDF,
    generateChatPDF,
    generateStatisticsExcel,
    downloadReport,
    deleteReport,
    listReports
};