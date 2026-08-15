const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('./database');
const { createNotification } = require('./notifications');

// إعداد تخزين الملفات
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

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
}).single('file');

// رفع ملف
const uploadFile = (req, res) => {
    upload(req, res, async (err) => {
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
            
            // إشعار للمستخدمين في نفس الغرفة
            if (room_id) {
                const roomUsers = await pool.query(`SELECT user_id FROM messages WHERE room_id = $1 GROUP BY user_id`, [room_id]);
                for (const user of roomUsers.rows) {
                    if (user.user_id !== req.user.id) {
                        await createNotification(
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
};

// تحميل ملف
const downloadFile = async (fileId, filename) => {
  try {
    const response = await fetch(`http://localhost:5000/api/files/${fileId}/download`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      const error = await response.json();
      alert(error.error || 'Download failed');
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    alert('Download failed');
  }
};

// حذف ملف
const deleteFile = async (req, res) => {
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
};

// جلب الملفات للمستخدم
const getUserFiles = async (req, res) => {
    const { folder = '/', limit = 50, offset = 0 } = req.query;
    try {
        const result = await pool.query(
            `SELECT f.*, u.username as uploaded_by_name
             FROM files f
             LEFT JOIN users u ON f.uploaded_by = u.id
             WHERE f.uploaded_by = $1 AND f.folder = $2
             ORDER BY f.created_at DESC
             LIMIT $3 OFFSET $4`,
            [req.user.id, folder, limit, offset]
        );
        
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM files WHERE uploaded_by = $1 AND folder = $2`,
            [req.user.id, folder]
        );
        
        // جلب المجلدات
        const foldersResult = await pool.query(
            `SELECT DISTINCT folder FROM files WHERE uploaded_by = $1 AND folder != '/'`,
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
};

// الحصول على إحصائيات التخزين
const getStorageStats = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT SUM(file_size) as total_size, COUNT(*) as total_files FROM files WHERE uploaded_by = $1`,
            [req.user.id]
        );
        res.json({
            totalSize: parseInt(result.rows[0].total_size) || 0,
            totalFiles: parseInt(result.rows[0].total_files) || 0,
            maxStorage: 100 * 1024 * 1024 // 100MB
        });
    } catch (error) {
        console.error('Error fetching storage stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

module.exports = {
    uploadFile,
    downloadFile,
    deleteFile,
    getUserFiles,
    getStorageStats
};