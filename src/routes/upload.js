const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/auth');

// Configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

// Test endpoint to verify Cloudinary credentials
router.get('/test-credentials', protect, async (req, res) => {
    try {
        const result = await cloudinary.api.ping();
        res.json({
            success: true,
            message: 'Cloudinary credentials are valid!',
            data: result
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Cloudinary credentials are INVALID. Please check your .env file.',
            error: error.message
        });
    }
});

// Upload endpoint
router.post('/', protect, upload.any(), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const file = req.files[0];

        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'yan_uploads',
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(file.buffer);
        });

        const result = await uploadPromise;

        res.status(200).json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format
            }
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
});

module.exports = router;
