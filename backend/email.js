const nodemailer = require('nodemailer');
require('dotenv').config();

// إعدادات البريد
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// إرسال إشعار تعيين مهمة
const sendTaskAssignedEmail = async (toEmail, username, taskTitle, dueDate) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email credentials not configured');
        return false;
    }
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: `📋 New Task Assigned: ${taskTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Swiss Knife</h1>
                </div>
                <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px;">
                    <h2>Hello ${username},</h2>
                    <p>A new task has been assigned to you:</p>
                    <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <strong style="color: #3b82f6;">📌 Task:</strong> ${taskTitle}<br>
                        <strong style="color: #3b82f6;">📅 Due Date:</strong> ${new Date(dueDate).toLocaleString()}
                    </div>
                    <p>Log in to Swiss Knife to view and manage your tasks.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">
                        This is an automated message from Swiss Knife.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error.message);
        return false;
    }
};

// إشعار اقتراب موعد المهمة
const sendTaskReminderEmail = async (toEmail, username, taskTitle, dueDate) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email credentials not configured');
        return false;
    }
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: `⏰ Task Reminder: ${taskTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Task Reminder</h1>
                </div>
                <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px;">
                    <h2>Hello ${username},</h2>
                    <p>This is a reminder that your task is due soon:</p>
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <strong style="color: #f59e0b;">📌 Task:</strong> ${taskTitle}<br>
                        <strong style="color: #f59e0b;">📅 Due Date:</strong> ${new Date(dueDate).toLocaleString()}
                    </div>
                    <p>Please complete it before the deadline.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">
                        This is an automated message from Swiss Knife.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reminder sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending reminder:', error.message);
        return false;
    }
};

// إشعار عند ذكر المستخدم
const sendMentionEmail = async (toEmail, username, mentionedBy, message, roomName) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email credentials not configured');
        return false;
    }
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: `🔔 You were mentioned in #${roomName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">You were mentioned!</h1>
                </div>
                <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px;">
                    <h2>Hello ${username},</h2>
                    <p><strong>${mentionedBy}</strong> mentioned you in <strong>#${roomName}</strong>:</p>
                    <div style="background: #f3e8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        "${message}"
                    </div>
                    <p>Log in to Swiss Knife to join the conversation.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">
                        This is an automated message from Swiss Knife.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Mention email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending mention email:', error.message);
        return false;
    }
};

module.exports = { sendTaskAssignedEmail, sendTaskReminderEmail, sendMentionEmail };