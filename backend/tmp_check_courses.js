const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');

async function checkCourses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const courses = await Course.find({ quarter: 'Q1' }).populate('lessons');
        console.log(`Found ${courses.length} courses for Q1:`);
        courses.forEach(c => {
            console.log(`- Title: "${c.title}", Status: "${c.status}", Category: "${c.category}", Lessons: ${c.lessons?.length || 0}`);
        });

        const allQuarters = await Course.aggregate([
            { $group: { _id: "$quarter", count: { $sum: 1 } } }
        ]);
        console.log('Courses per quarter:', allQuarters);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkCourses();
