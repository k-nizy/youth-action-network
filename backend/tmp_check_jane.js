const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'member@yanrwanda.org' });
        if (user) {
            console.log(`User: ${user.name}`);
            console.log(`ID: ${user._id}`);
            console.log(`Role: ${user.role}`);
        } else {
            console.log('User not found');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUser();
