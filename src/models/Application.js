const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['submitted', 'screening', 'under_review', 'approved', 'rejected', 'appealed'],
        default: 'submitted'
    },
    // SMART MOVE: Accept any structure from frontend
    submissionData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    documents: [{
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    reviewerNotes: String,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Application', applicationSchema);
