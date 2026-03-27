const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./src/models/Course');

async function checkCourses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const courses = await Course.find();
        console.log(`Total courses in DB: ${courses.length}`);
        
        courses.forEach(c => {
            console.log(`Course: "${c.title}"`);
            console.log(`  _id: ${c._id}`);
            console.log(`  status: "${c.status}"`);
            console.log(`  quarter: "${c.quarter}"`);
            console.log(`  category: "${c.category}"`);
            console.log('---');
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkCourses();
