const { sendTaskAssignedEmail } = require('./email');
require('dotenv').config();

const test = async () => {
    console.log('Testing email...');
    console.log('Sending to:', process.env.EMAIL_USER);
    
    await sendTaskAssignedEmail(
        process.env.EMAIL_USER, // سيرسل إلى نفس البريد
        'TestUser',
        'This is a test task',
        new Date()
    );
    
    console.log('Email sent! Check your inbox.');
};

test();