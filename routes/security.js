const express = require('express');
const router = express.Router();
const SecuritySettings = require('../models/SecuritySettings');

// Helper function to get client IP and user agent
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
  userAgent: req.headers['user-agent']
});

// GET /api/security/settings - Get current security settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await SecuritySettings.getOrCreate();
    
    // Return settings without sensitive data
    const safeSettings = {
      pinRequired: settings.pinRequired,
      autoLockMinutes: settings.autoLockMinutes,
      maxAttempts: settings.maxAttempts,
      lockoutDurationMinutes: settings.lockoutDurationMinutes,
      sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
      twoFactorEnabled: settings.twoFactorEnabled,
      emailNotifications: settings.emailNotifications,
      hasPin: !!settings.pin,
      pinCreatedAt: settings.pinCreatedAt,
      pinLastChanged: settings.pinLastChanged,
      pinAttempts: settings.pinAttempts,
      pinLocked: settings.isPinLocked(),
      lockTimeRemaining: settings.getLockTimeRemaining(),
      lastActivity: settings.lastActivity,
      securityLog: settings.securityLog.slice(-10) // Return last 10 log entries
    };
    
    res.json(safeSettings);
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ message: 'Failed to fetch security settings' });
  }
});

// POST /api/security/pin/create - Create or update PIN
router.post('/pin/create', async (req, res) => {
  try {
    const { currentPin, newPin, confirmPin } = req.body;
    const clientInfo = getClientInfo(req);
    
    // Validate input
    if (!newPin || !confirmPin) {
      return res.status(400).json({ message: 'New PIN and confirmation are required' });
    }
    
    if (newPin !== confirmPin) {
      return res.status(400).json({ message: 'New PIN and confirmation do not match' });
    }
    
    // Validate PIN format
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }
    
    // Check for common PINs
    if (['0000', '1111', '1234', '4321'].includes(newPin)) {
      return res.status(400).json({ message: 'PIN is too common, choose a more secure PIN' });
    }
    
    const settings = await SecuritySettings.getOrCreate();
    
    // Check if PIN is locked
    if (settings.isPinLocked()) {
      const remaining = settings.getLockTimeRemaining();
      return res.status(423).json({ 
        message: `PIN creation is locked. Try again in ${remaining} minutes.`,
        lockTimeRemaining: remaining
      });
    }
    
    // Verify current PIN if setting exists
    if (settings.pin && currentPin) {
      const verification = settings.verifyPin(currentPin);
      if (!verification.success) {
        return res.status(400).json({ message: verification.error });
      }
    } else if (settings.pin && !currentPin) {
      return res.status(400).json({ message: 'Current PIN is required to change PIN' });
    }
    
    // Update PIN
    const isNewPin = !settings.pin;
    settings.pin = newPin;
    settings.pinLastChanged = new Date();
    if (isNewPin) {
      settings.pinCreatedAt = new Date();
    }
    
    await settings.resetFailedAttempts();
    
    // Log the action
    await settings.logSecurityEvent(
      isNewPin ? 'PIN_CREATED' : 'PIN_CHANGED',
      { isNewPin },
      clientInfo.ipAddress,
      clientInfo.userAgent
    );
    
    res.json({
      message: isNewPin ? 'PIN created successfully' : 'PIN changed successfully',
      hasPin: true,
      pinCreatedAt: settings.pinCreatedAt,
      pinLastChanged: settings.pinLastChanged
    });
    
  } catch (error) {
    console.error('Error creating/updating PIN:', error);
    res.status(500).json({ message: 'Failed to create/update PIN' });
  }
});

// POST /api/security/pin/verify - Verify PIN
router.post('/pin/verify', async (req, res) => {
  try {
    const { pin } = req.body;
    const clientInfo = getClientInfo(req);
    
    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }
    
    const settings = await SecuritySettings.getOrCreate();
    
    if (!settings.pin) {
      return res.status(400).json({ message: 'No PIN is set' });
    }
    
    const verification = settings.verifyPin(pin);
    
    if (verification.success) {
      await settings.logSecurityEvent('PIN_VERIFIED', {}, clientInfo.ipAddress, clientInfo.userAgent);
    }
    
    res.json(verification);
    
  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({ message: 'Failed to verify PIN' });
  }
});

// DELETE /api/security/pin - Remove PIN
router.delete('/pin', async (req, res) => {
  try {
    const { currentPin } = req.body;
    const clientInfo = getClientInfo(req);
    
    if (!currentPin) {
      return res.status(400).json({ message: 'Current PIN is required to remove PIN' });
    }
    
    const settings = await SecuritySettings.getOrCreate();
    
    if (!settings.pin) {
      return res.status(400).json({ message: 'No PIN is set' });
    }
    
    // Verify current PIN
    const verification = settings.verifyPin(currentPin);
    if (!verification.success) {
      return res.status(400).json({ message: verification.error });
    }
    
    // Remove PIN
    settings.pin = undefined;
    settings.pinCreatedAt = null;
    settings.pinLastChanged = null;
    await settings.resetFailedAttempts();
    
    // Log the action
    await settings.logSecurityEvent('PIN_REMOVED', {}, clientInfo.ipAddress, clientInfo.userAgent);
    
    res.json({ message: 'PIN removed successfully', hasPin: false });
    
  } catch (error) {
    console.error('Error removing PIN:', error);
    res.status(500).json({ message: 'Failed to remove PIN' });
  }
});

// POST /api/security/pin/unlock - Unlock PIN (admin function)
router.post('/pin/unlock', async (req, res) => {
  try {
    const settings = await SecuritySettings.getOrCreate();
    const clientInfo = getClientInfo(req);
    
    if (!settings.isPinLocked()) {
      return res.status(400).json({ message: 'PIN is not locked' });
    }
    
    await settings.resetFailedAttempts();
    await settings.logSecurityEvent('UNLOCK', { adminAction: true }, clientInfo.ipAddress, clientInfo.userAgent);
    
    res.json({ message: 'PIN unlocked successfully' });
    
  } catch (error) {
    console.error('Error unlocking PIN:', error);
    res.status(500).json({ message: 'Failed to unlock PIN' });
  }
});

// PUT /api/security/settings - Update security configuration
router.put('/settings', async (req, res) => {
  try {
    const {
      pinRequired,
      autoLockMinutes,
      maxAttempts,
      lockoutDurationMinutes,
      sessionTimeoutMinutes,
      twoFactorEnabled,
      emailNotifications
    } = req.body;
    
    const clientInfo = getClientInfo(req);
    const settings = await SecuritySettings.getOrCreate();
    
    // Update settings
    if (pinRequired !== undefined) settings.pinRequired = pinRequired;
    if (autoLockMinutes !== undefined) settings.autoLockMinutes = autoLockMinutes;
    if (maxAttempts !== undefined) settings.maxAttempts = maxAttempts;
    if (lockoutDurationMinutes !== undefined) settings.lockoutDurationMinutes = lockoutDurationMinutes;
    if (sessionTimeoutMinutes !== undefined) settings.sessionTimeoutMinutes = sessionTimeoutMinutes;
    if (twoFactorEnabled !== undefined) settings.twoFactorEnabled = twoFactorEnabled;
    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
    
    await settings.save();
    
    // Log the action
    await settings.logSecurityEvent(
      'SETTINGS_UPDATED',
      { updatedFields: Object.keys(req.body) },
      clientInfo.ipAddress,
      clientInfo.userAgent
    );
    
    res.json({
      message: 'Security settings updated successfully',
      settings: {
        pinRequired: settings.pinRequired,
        autoLockMinutes: settings.autoLockMinutes,
        maxAttempts: settings.maxAttempts,
        lockoutDurationMinutes: settings.lockoutDurationMinutes,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        twoFactorEnabled: settings.twoFactorEnabled,
        emailNotifications: settings.emailNotifications
      }
    });
    
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ message: 'Failed to update security settings' });
  }
});

// GET /api/security/log - Get security audit log
router.get('/log', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const settings = await SecuritySettings.getOrCreate();
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    
    const logEntries = settings.securityLog
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(startIndex, endIndex);
    
    res.json({
      logEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: settings.securityLog.length,
        pages: Math.ceil(settings.securityLog.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching security log:', error);
    res.status(500).json({ message: 'Failed to fetch security log' });
  }
});

// POST /api/security/activity - Update last activity
router.post('/activity', async (req, res) => {
  try {
    const settings = await SecuritySettings.getOrCreate();
    settings.lastActivity = new Date();
    await settings.save();
    
    res.json({ message: 'Activity updated successfully', lastActivity: settings.lastActivity });
    
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Failed to update activity' });
  }
});

module.exports = router;
