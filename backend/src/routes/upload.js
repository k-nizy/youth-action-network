const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');

// Configure cloudinary safely
try {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
} catch (configErr) {
    console.warn("Cloudinary config warning:", configErr.message);
}

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

const os = require('os');

// Helper function to save file locally
const saveLocally = (file) => {
    // Vercel has a read-only filesystem except for /tmp
    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    const uploadDir = isVercel ? os.tmpdir() : path.join(__dirname, '../../uploads');
    
    if (!isVercel && !fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Create a safe cross-platform file name
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `local_${Date.now()}_${safeOriginalName}`;
    const filePath = path.join(uploadDir, fileName);
    
    fs.writeFileSync(filePath, file.buffer);
    
    // Note: On Vercel, this file will be lost after the lambda execution
    // and cannot be served via static middleware since it's in /tmp
    return {
        url: isVercel ? 'FILE_STORED_IN_TMP_NON_PERSISTENT' : `/uploads/${fileName}`,
        publicId: fileName,
        format: safeOriginalName.split('.').pop(),
        isTemporary: isVercel
    };
};

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

        // Ensure we try Cloudinary first, but fallback aggressively
        let uploadResult;
        try {
            uploadResult = await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => reject(new Error('Cloudinary timeout')), 8000);
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'yan_uploads',
                        resource_type: 'auto'
                    },
                    (error, result) => {
                        clearTimeout(timeoutId);
                        if (error) {
                            reject(new Error(error.message || 'Unknown Cloudinary error'));
                        } else {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id,
                                format: result.format || file.originalname.split('.').pop()
                            });
                        }
                    }
                );
                uploadStream.end(file.buffer);
            });
        } catch (cloudErr) {
            console.warn('Cloudinary upload failed, falling back to local storage:', cloudErr.message);
            // DO LOCAL FALLBACK
            uploadResult = saveLocally(file);
        }

        // Return unified success response
        return res.status(200).json({
            success: true,
            data: uploadResult,
            warning: uploadResult.isTemporary ? 'Cloudinary failed. File stored in non-persistent /tmp storage.' : undefined
        });

    } catch (error) {
        console.error('Fatal Upload Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
});

module.exports = router;
