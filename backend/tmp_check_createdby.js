const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./src/models/Course');

async function checkCourses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const courses = await Course.find();
        console.log(`Total courses: ${courses.length}`);
        courses.forEach(c => {
            console.log(`- ${c.title} (Quarter: ${c.quarter}, CreatedBy: ${c.createdBy})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkCourses();
