const { QUOTATION_CONFIG, USER_ROLES } = require('../utils/constants');

/**
 * Middleware to check if edit quotation access is allowed based on time, user role, and quotation creation date
 * Employees can only edit quotations between 9:00 AM to 6:00 PM IST
 * Employees can only edit quotations created on the current Indian date
 * Admins can access anytime and edit any quotation
 */
const checkEditQuotationAccess = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Admin can access anytime and edit any quotation
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Get current time in Indian timezone
    const now = new Date();
    const indianTime = new Date(
      now.toLocaleString('en-US', { timeZone: QUOTATION_CONFIG.EDIT_ACCESS.TIMEZONE })
    );

    const currentHour = indianTime.getHours();
    const startHour = QUOTATION_CONFIG.EDIT_ACCESS.START_HOUR;
    const endHour = QUOTATION_CONFIG.EDIT_ACCESS.END_HOUR;

    // Check if current time is within allowed hours
    if (currentHour < startHour || currentHour >= endHour) {
      return res.status(400).json({
        success: false,
        message: QUOTATION_CONFIG.EDIT_ACCESS.TIME_MESSAGE,
        error: 'TIME_ACCESS_RESTRICTED',
        currentTime: indianTime.toLocaleTimeString('en-US', {
          timeZone: QUOTATION_CONFIG.EDIT_ACCESS.TIMEZONE,
          hour12: true,
        }),
        allowedHours: `${startHour}:00 AM to ${endHour}:00 PM IST`,
      });
    }

    // Check if quotation was created on the current Indian date
    const { Quotation } = require('../models');

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found',
        error: 'QUOTATION_NOT_FOUND',
      });
    }

    // Get quotation creation date in Indian timezone
    const quotationCreatedAt = new Date(quotation.createdAt);

    // Get current date in Indian timezone using proper date formatting
    const currentIndianDateStr = indianTime.toLocaleDateString('en-CA', {
      timeZone: QUOTATION_CONFIG.EDIT_ACCESS.TIMEZONE,
    }); // en-CA format gives YYYY-MM-DD

    // Get quotation creation date in Indian timezone using proper date formatting
    const quotationCreatedDateStr = quotationCreatedAt.toLocaleDateString('en-CA', {
      timeZone: QUOTATION_CONFIG.EDIT_ACCESS.TIMEZONE,
    }); // en-CA format gives YYYY-MM-DD

    // Get quotation creation date in Indian timezone (without time)
    const quotationCreatedDate = new Date(
      quotationCreatedAtIndian.getFullYear(),
      quotationCreatedAtIndian.getMonth(),
      quotationCreatedAtIndian.getDate()
    );

    // Compare date strings directly (YYYY-MM-DD format)
    if (quotationCreatedDateStr !== currentIndianDateStr) {
      return res.status(400).json({
        success: false,
        message: QUOTATION_CONFIG.EDIT_ACCESS.DATE_MESSAGE,
        error: 'DATE_ACCESS_RESTRICTED',
        currentDate: currentIndianDateStr,
        quotationCreatedDate: quotationCreatedDateStr,
        allowedAccess: 'Current date quotations only',
      });
    }

    // All checks passed - allow access
    return next();
  } catch (error) {
    console.error('Time access control error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking access time',
      error: 'TIME_CHECK_ERROR',
    });
  }
};

module.exports = {
  checkEditQuotationAccess,
};
