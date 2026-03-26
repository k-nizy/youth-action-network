const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
        required: true
    },
    quarter: {
        type: String,
        required: [true, 'Please add a quarter (e.g., Q1, Q2)'],
        enum: ['Q1', 'Q2', 'Q3', 'Q4']
    },
    fileUrl: {
        type: String,
        required: [true, 'Please provide the uploaded file URL']
    },
    fileName: {
        type: String,
        required: [true, 'Please provide the file name']
    },
    fileFormat: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'graded'],
        default: 'pending'
    },
    grade: {
        type: Number,
        min: 0,
        max: 100
    },
    feedback: {
        type: String
    },
    reviewedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Prevent user from submitting same course multiple times in same quarter unless previous was graded
SubmissionSchema.index({ user: 1, course: 1, quarter: 1 }, { unique: false });

module.exports = mongoose.model('Submission', SubmissionSchema);
