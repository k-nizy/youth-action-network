const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const User = require('../src/models/User');

// Load env vars
dotenv.config();

// We need a dummy admin user if none exists
const seedModules = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB Connected...');

        // Find an admin user to act as creator
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin found, creating a dummy one for the modules...');
            admin = await User.create({
                name: 'System Admin',
                email: 'admin@yan.com',
                password: 'password123',
                role: 'admin',
                isVerified: true
            });
        }

        // Module contents (from YAN-EIP Q1)
        const q1Courses = [
            {
                title: "Leadership Youth NGOs",
                description: "Introduction/Foundations.",
                category: "Capacity Building - Q1",
                quarter: "Q1",
                difficulty: "beginner",
                status: "published",
                duration: "2 hours",
                createdBy: admin._id,
                _lesson: {
                    title: "Module 1",
                    content: "Canva presentation for Leadership Youth NGOs",
                    order: 1,
                    videoUrl: "https://www.canva.com/design/DAHD9d2a0HI/FGGnLwWyVt9MEkOh1dKZKA/view?utm_content=DAHD9d2a0HI&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hde5b6d7be9",
                    isQuiz: false
                }
            },
            {
                title: "Resilience Adaptive Mindset",
                description: "Core concepts and practice.",
                category: "Capacity Building - Q1",
                quarter: "Q1",
                difficulty: "beginner",
                status: "published",
                duration: "2 hours",
                createdBy: admin._id,
                _lesson: {
                    title: "Module 2",
                    content: "Canva presentation for Resilience Adaptive Mindset",
                    order: 1,
                    videoUrl: "https://www.canva.com/design/DAHD9h3F6D8/hmoYB3_d9azl-bi8ki33_A/view?utm_content=DAHD9h3F6D8&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=haa49b074a2",
                    isQuiz: false
                }
            },
            {
                title: "Soft Skills Self Management",
                description: "Assignments and reflection.",
                category: "Capacity Building - Q1",
                quarter: "Q1",
                difficulty: "beginner",
                status: "published",
                duration: "2 hours",
                createdBy: admin._id,
                _lesson: {
                    title: "Module 3",
                    content: "Canva presentation for Soft Skills Self Management",
                    order: 1,
                    videoUrl: "https://www.canva.com/design/DAHD9rYwVhc/VjKKoWNC2JO7yC5HhesU2g/view?utm_content=DAHD9rYwVhc&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h180ea3a6da",
                    isQuiz: false
                }
            }
        ];

        console.log('Seeding Q1 Capacity Building Courses...');
        
        for (const data of q1Courses) {
            // Check if course already exists
            let course = await Course.findOne({ title: data.title });
            if (!course) {
                // Remove lesson data from course creation
                const { _lesson, ...courseData } = data;
                course = await Course.create(courseData);
                console.log(`Created Course: ${course.title}`);

                // Create the attached lesson
                await Lesson.create({
                    course: course._id,
                    title: _lesson.title,
                    content: _lesson.content,
                    order: _lesson.order,
                    videoUrl: _lesson.videoUrl,
                    isQuiz: _lesson.isQuiz
                });
                console.log(`Attached Lesson to Course: ${course.title}`);
            } else {
                console.log(`Course already exists: ${course.title}`);
            }
        }

        console.log('Seeding Complete!');
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedModules();
