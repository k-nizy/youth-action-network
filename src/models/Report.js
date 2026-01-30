const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportType: {
        type: String,
        enum: ['activity', 'beneficiary', 'engagement', 'capacity_needs', 'compliance'],
        required: true
    },
    period: {
        type: String,
        required: true // e.g., "Q1 2024", "2024"
    },
    // Flexible metrics storage - allows any JSON structure
    metrics: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema);
