const express = require('express');
const {
    getResources,
    getResource,
    createResource,
    updateResource,
    deleteResource,
    completeResource,
    getMyProgress
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getResources);
router.get('/progress/me', protect, getMyProgress);
router.get('/:id', protect, getResource);
router.post('/', protect, authorize('admin'), createResource);
router.put('/:id', protect, authorize('admin'), updateResource);
router.delete('/:id', protect, authorize('admin'), deleteResource);
router.post('/:id/complete', protect, completeResource);

module.exports = router;
