const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a resource title'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['video', 'pdf', 'guide', 'module', 'case_study'],
        required: true
    },
    url: {
        type: String,
        required: [true, 'Please provide a resource URL'],
        trim: true
    },
    category: {
        type: String,
        enum: ['finance', 'monitoring_evaluation', 'governance', 'advocacy', 'leadership', 'project_management', 'other'],
        required: true
    },
    skillArea: {
        type: String,
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Resource', resourceSchema);
