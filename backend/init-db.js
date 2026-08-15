const { createTables, testConnection } = require('./database');

const init = async () => {
    console.log('🚀 Initializing database...');
    await testConnection();
    await createTables();
    console.log('✨ Database initialization complete!');
    process.exit();
};

init();