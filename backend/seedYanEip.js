require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');

seedYanEip();

async function seedYanEip() {
    await connectDB();

    try {
        console.log('Seeding YAN-EIP Capacity Building Data...');

        // 1. Get or create a creator user
        let admin = await User.findOne({ email: 'admin_lms_test@example.com' });
        if (!admin) {
            admin = await User.create({
                name: 'LMS Admin',
                email: 'admin_lms_test@example.com',
                password: 'password123',
                role: 'admin'
            });
        }

        // Create the user dukeherve3@gmail.com specified by the prompt to ensure it exists
        // so we can log in with it.
        let dukeUser = await User.findOne({ email: 'dukeherve3@gmail.com' });
        if (!dukeUser) {
            dukeUser = await User.create({
                name: 'Duke Herve',
                email: 'dukeherve3@gmail.com',
                password: 'Thatone05$',
                role: 'member'
            });
        } else {
            // Update password just in case
            dukeUser.password = 'Thatone05$';
            await dukeUser.save();
        }

        // 2. Clear old test courses to prevent duplicates
        await Course.deleteMany({ title: 'YAN Capacity Building - Q1' });

        // 3. Create a test Course
        const course = await Course.create({
            title: 'YAN Capacity Building - Q1',
            description: 'Comprehensive capacity building module including Leadership, Resilience, and Soft Skills resources from the YAN-EIP curriculum.',
            status: 'published',
            difficulty: 'intermediate',
            duration: '4 Weeks',
            quarter: 'Q1',
            createdBy: admin._id
        });

        // 4. Create Lessons for the Course
        const lesson1 = await Lesson.create({
            course: course._id,
            title: 'Leadership',
            content: '<p>Resources and training materials for Leadership:<ul><li>Follow-up resources_ Leadership_Youth_NGOs.pdf</li><li>Leadership Youth Session guide ( Final).pdf</li><li>Leadership_Youth_NGOs_v2 updated (1).pptx</li></ul></p>',
            order: 1,
            resourceLinks: [
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q1/Follow-up%20resources_%20Leadership_Youth_NGOs.pdf',
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q1/Leadership%20Youth%20Session%20guide%20(%20Final).pdf'
            ]
        });

        const lesson2 = await Lesson.create({
            course: course._id,
            title: 'Resilience',
            content: '<p>Resources and training materials for Resilience:<ul><li>Follow-up resources_ Resilience.pdf</li><li>Resilience Session Guide.pdf</li><li>Resilience_Adaptive_Mindset_Edited.pptx</li></ul></p>',
            order: 2,
            resourceLinks: [
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q1/Follow-up%20resources_%20Resilience.pdf',
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q1/Resilience%20Session%20Guide.pdf'
            ]
        });

        const lesson3 = await Lesson.create({
            course: course._id,
            title: 'Soft Skills',
            content: '<p>Resources and training materials for Soft Skills:<ul><li>Follow-up resources_ Soft skills.pdf</li><li>Session guide 3 (1).pdf</li><li>Soft_Skills_Self_Management_Edited.pptx</li></ul></p>',
            order: 3,
            resourceLinks: [
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q1/Follow-up%20resources_%20Soft%20skills.pdf',
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q1/Session%20guide%203%20(1).pdf'
            ]
        });

        // 5. Create Q2, Q3, Q4 Courses
        const courseQ2 = await Course.create({
            title: 'YAN Capacity Building - Q2',
            description: 'Quarter 2 capacity building focusing on Case Studies and Project Design and Management Training.',
            status: 'published',
            difficulty: 'intermediate',
            duration: '4 Weeks',
            quarter: 'Q2',
            createdBy: admin._id
        });
        await Lesson.create({
            course: courseQ2._id,
            title: 'Project Design & Management',
            content: '<p>Explore Quarter 2 Project Design and assignments.</p>',
            order: 1,
            resourceLinks: [
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q2/Project_Design_Management_Training(%20Quarter%202).pdf',
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q2/Assignment%202_Sample%20Quarter%202.pdf',
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q2/Case%20study%202_Quarter%202%20sample.pdf'
            ]
        });

        const courseQ3 = await Course.create({
            title: 'YAN Capacity Building - Q3',
            description: 'Quarter 3 capacity building focusing on Implementation Case Studies and Assignments.',
            status: 'published',
            difficulty: 'intermediate',
            duration: '4 Weeks',
            quarter: 'Q3',
            createdBy: admin._id
        });
        await Lesson.create({
            course: courseQ3._id,
            title: 'Implementation & Case Study 3',
            content: '<p>Resources for Quarter 3 assignments.</p>',
            order: 1,
            resourceLinks: [
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q3/Assignment%203.pdf',
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q3/Case%20study%203.pdf'
            ]
        });

        const courseQ4 = await Course.create({
            title: 'YAN Capacity Building - Q4',
            description: 'Quarter 4 capacity building focusing on Final Case Studies and Capstone Assignments.',
            status: 'published',
            difficulty: 'advanced',
            duration: '4 Weeks',
            quarter: 'Q4',
            createdBy: admin._id
        });
        await Lesson.create({
            course: courseQ4._id,
            title: 'Capstone & Case Study 4',
            content: '<p>Resources for Quarter 4 assignments.</p>',
            order: 1,
            resourceLinks: [
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q4/Assignment%204.pdf',
                'https://github.com/MEE-DRED/YAN-EIP/raw/main/capacity.assets-q4/Case%20study%204.pdf'
            ]
        });

        console.log('YAN-EIP LMS Data seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}
