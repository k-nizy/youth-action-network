const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const user = await User.findOne({ email: 'member@example.com' });
        if (user) {
            console.log(`User: ${user.name}`);
            console.log(`Role: ${user.role}`);
        } else {
            console.log('User member@example.com not found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUser();
