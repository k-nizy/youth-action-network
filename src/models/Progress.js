const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    },
    startedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure user can't have duplicate progress records for same resource
progressSchema.index({ user: 1, resource: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
