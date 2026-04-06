const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// ================================
// TOKEN HELPERS
// ================================

// Sign a short-lived access token (1 hour)
const signAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
};

// Generate a crypto-secure random refresh token (raw string)
const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

// Hash a refresh token with SHA-256 for DB storage
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Cookie options for refresh token
const getRefreshCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,                          // Not accessible via JavaScript
        secure: isProduction,                    // HTTPS only in production
        sameSite: isProduction ? 'strict' : 'lax', // Strict in prod, Lax for local dev
        maxAge: 30 * 24 * 60 * 60 * 1000,       // 30 days in milliseconds
        path: '/'                                // Available globally
    };
};

// Helper: save hashed refresh token to user and set cookie
const attachRefreshToken = async (res, user) => {
    const rawRefreshToken = generateRefreshToken();
    const hashed = hashToken(rawRefreshToken);

    // Store hashed token — single active token per user (overwrites previous)
    await User.findByIdAndUpdate(user._id, { refreshTokenHash: hashed });

    // Set httpOnly cookie
    res.cookie('refreshToken', rawRefreshToken, getRefreshCookieOptions());
};

// ================================
// CONTROLLERS
// ================================

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, organization } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Auto-assign admin role for the platform owner
        const ADMIN_EMAILS = ['yaneip26@gmail.com'];
        const assignedRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : (role || 'applicant');

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: assignedRole,
            organization
        });

        // Generate access token
        const verificationToken = user.createEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        const clientUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const verifyUrl = `${clientUrl}/api/v1/auth/verifyemail/${verificationToken}`;
        const message = `Welcome to YAN Rwanda!\n\nPlease verify your email by clicking the link below:\n${verifyUrl}\n\nIf you did not request this, please ignore this email.`;

        const hasSmtpCredentials = Boolean(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);
        const emailTasks = [];
        if (!hasSmtpCredentials) {
            console.warn('SMTP not configured (SMTP_EMAIL/SMTP_PASSWORD missing). Skipping registration emails.');
        } else {
            emailTasks.push(
                sendEmail({
                    email: user.email,
                    subject: 'Verify your YAN Rwanda Account',
                    message
                })
            );
        }

        // Send professional welcome email
        const welcomeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:40px 20px;">
                <tr><td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#111827,#1a1f35);border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
                        <!-- Header -->
                        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 30px;text-align:center;">
                            <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;line-height:60px;font-size:24px;font-weight:800;color:#fff;">Y</div>
                            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Welcome to YAN Rwanda!</h1>
                            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Youth Advocates Network</p>
                        </td></tr>
                        <!-- Body -->
                        <tr><td style="padding:36px 40px;">
                            <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 20px;">Hi <strong style="color:#a5b4fc;">${user.name}</strong>,</p>
                            <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px;">Welcome aboard! We're thrilled to have you join the Youth Advocates Network Rwanda — a growing community of young changemakers driving real impact across Rwanda.</p>
                            <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 24px;">Your role: <span style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:3px 14px;border-radius:20px;font-size:13px;font-weight:600;text-transform:capitalize;">${user.role}</span></p>
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
                                <a href="${clientUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">Explore the Platform &rarr;</a>
                            </td></tr></table>
                            <div style="border-top:1px solid rgba(99,102,241,0.15);padding-top:20px;margin-top:8px;">
                                <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">Here's what you can do next:</p>
                                <ul style="color:#94a3b8;font-size:13px;line-height:2;padding-left:20px;margin:8px 0 0;">
                                    <li>Complete your profile</li>
                                    <li>Explore our member organizations</li>
                                    <li>Discover learning opportunities</li>
                                    <li>Connect with fellow youth advocates</li>
                                </ul>
                            </div>
                        </td></tr>
                        <!-- Footer -->
                        <tr><td style="background:rgba(0,0,0,0.2);padding:24px 40px;text-align:center;border-top:1px solid rgba(99,102,241,0.1);">
                            <p style="color:#64748b;font-size:12px;margin:0 0 4px;">&copy; ${new Date().getFullYear()} Youth Advocates Network Rwanda</p>
                            <p style="color:#475569;font-size:11px;margin:0;">Empowering youth to create lasting impact</p>
                        </td></tr>
                    </table>
                </td></tr>
            </table>
        </body>
        </html>`;

        if (hasSmtpCredentials) {
            emailTasks.push(
                sendEmail({
                    email: user.email,
                    subject: `🎉 Welcome to YAN Rwanda, ${user.name}!`,
                    message: `Welcome to YAN Rwanda, ${user.name}! We're excited to have you join our community of youth advocates.`,
                    html: welcomeHtml
                })
            );
        }

        // Admin Notification Email
        const adminEmail = 'yaneip26@gmail.com'; 
        const adminNotificationHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #03045E;">New User Registration on YAN</h2>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> <span style="text-transform: capitalize;">${user.role}</span></p>
            <p><strong>Organization:</strong> ${user.organization || 'N/A'}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated notification from the YAN Platform.</p>
        </div>`;

        if (hasSmtpCredentials) {
            emailTasks.push(
                sendEmail({
                    email: adminEmail,
                    subject: `New YAN Registration: ${user.name}`,
                    message: `A new user has registered on YAN.\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nOrganization: ${user.organization || 'N/A'}`,
                    html: adminNotificationHtml
                })
            );
        }

        // Wait for delivery attempts so failures are visible in logs.
        if (emailTasks.length > 0) {
            const emailResults = await Promise.allSettled(emailTasks);
            emailResults.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const label = index === 0
                        ? 'Email verification sending failed'
                        : index === 1
                            ? 'Welcome email sending failed'
                            : 'Admin notification email failed';
                    console.error(`${label}:`, result.reason);
                }
            });
        }

        const accessToken = signAccessToken(user._id);

        // Attach refresh token (cookie + DB)
        await attachRefreshToken(res, user);

        res.status(201).json({
            success: true,
            token: accessToken,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists (include password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordCorrect = await user.correctPassword(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate access token
        const accessToken = signAccessToken(user._id);

        // Attach refresh token (cookie + DB)
        await attachRefreshToken(res, user);

        res.status(200).json({
            success: true,
            token: accessToken,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh access token using httpOnly cookie
// @route   POST /api/v1/auth/refresh
// @access  Public (cookie-authenticated)
exports.refreshToken = async (req, res, next) => {
    try {
        // 1. Read refresh token from httpOnly cookie
        const rawToken = req.cookies?.refreshToken;

        if (!rawToken) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }

        // 2. Hash the incoming token and look up user
        const incomingHash = hashToken(rawToken);

        const user = await User.findOne({ refreshTokenHash: incomingHash }).select('+refreshTokenHash');

        if (!user) {
            // Possible token reuse attack — token was already rotated
            // Security: Clear the cookie to prevent further reuse attempts
            res.clearCookie('refreshToken', getRefreshCookieOptions());

            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token — session invalidated'
            });
        }

        // 3. Issue new access token
        const accessToken = signAccessToken(user._id);

        // 4. Rotate refresh token (invalidate old, issue new)
        await attachRefreshToken(res, user);

        res.status(200).json({
            success: true,
            token: accessToken
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user — clear refresh token
// @route   POST /api/v1/auth/logout
// @access  Public (best-effort)
exports.logout = async (req, res, next) => {
    try {
        const rawToken = req.cookies?.refreshToken;

        if (rawToken) {
            // Remove hashed token from DB
            const incomingHash = hashToken(rawToken);
            await User.findOneAndUpdate(
                { refreshTokenHash: incomingHash },
                { $unset: { refreshTokenHash: 1 } }
            );
        }

        // Clear the cookie regardless
        res.clearCookie('refreshToken', getRefreshCookieOptions());

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name
        };

        if (req.body.organization !== undefined) {
            fieldsToUpdate.organization = req.body.organization;
        }

        if (req.body.profileImage !== undefined) {
            fieldsToUpdate.profileImage = req.body.profileImage;
        }

        if (req.body.bio !== undefined) {
            fieldsToUpdate.bio = req.body.bio;
        }

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'There is no user with that email address.' });
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const clientUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const actualResetUrl = `${clientUrl}/reset-password.html?token=${resetToken}`;

        const message = `Forgot your password? Submit a PUT request with your new password to: \n${actualResetUrl}.\nIf you didn't forget your password, please ignore this email!`;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Your password reset token (valid for 10 min)',
                message
            });
            res.status(200).json({ success: true, message: 'Token sent to email!' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'There was an error sending the email. Try again later!' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Token is invalid or has expired' });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        const accessToken = signAccessToken(user._id);
        await attachRefreshToken(res, user);

        res.status(200).json({ success: true, token: accessToken });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify email address
// @route   GET /api/v1/auth/verifyemail/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save({ validateBeforeSave: false });

        const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
        res.redirect(`${clientUrl}/index.html?verified=true`);
    } catch (error) {
        next(error);
    }
};
