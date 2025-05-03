const crypto = require('crypto');

// In a production environment, you'd want to store these in a database
const BETA_USERS = new Map();

// Generate a secure beta access token
function generateBetaToken(email) {
    const token = crypto.randomBytes(32).toString('hex');
    BETA_USERS.set(token, {
        email,
        createdAt: new Date()
    });
    return token;
}

// Middleware to check beta access
function requireBetaAccess(req, res, next) {
    const betaToken = req.headers['x-beta-token'] || req.query.beta_token;
    
    if (!betaToken || !BETA_USERS.has(betaToken)) {
        return res.status(401).json({
            error: 'Unauthorized: Valid beta access token required'
        });
    }

    // Add user info to request for potential logging/tracking
    req.betaUser = BETA_USERS.get(betaToken);
    next();
}

// Register a new beta user
async function registerBetaUser(email, inviteCode) {
    // In production, you'd want to validate the invite code against a database
    if (inviteCode !== process.env.BETA_INVITE_CODE) {
        throw new Error('Invalid invite code');
    }

    const token = generateBetaToken(email);
    return { token };
}

module.exports = {
    requireBetaAccess,
    registerBetaUser
}; 