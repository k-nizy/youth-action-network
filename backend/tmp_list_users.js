const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const users = await User.find();
        console.log(`Total users: ${users.length}`);
        users.forEach(u => {
            console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUsers();
