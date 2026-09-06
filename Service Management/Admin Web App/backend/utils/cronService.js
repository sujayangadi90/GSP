const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { sendPushNotification } = require('./notification');

/**
 * Sends push notifications to technicians who have tickets in 'assigned' status
 */
const sendDailyAssignedTicketNotifications = async () => {
  try {
    console.log('[Cron Job] Executing daily 10 AM technician assigned tickets notification check...');

    // Find all assigned tickets with a technician assigned
    const assignedTickets = await Ticket.find({
      status: 'assigned',
      assignedTechnician: { $exists: true, $ne: null }
    }).select('assignedTechnician');

    if (!assignedTickets || assignedTickets.length === 0) {
      console.log('[Cron Job] No tickets currently in assigned status. Skipping notifications.');
      return { techniciansNotified: 0, totalAssignedTickets: 0 };
    }

    // Count assigned tickets per technician ID
    const techCountsMap = {};
    assignedTickets.forEach(ticket => {
      const techId = ticket.assignedTechnician.toString();
      techCountsMap[techId] = (techCountsMap[techId] || 0) + 1;
    });

    const techIds = Object.keys(techCountsMap);

    // Fetch technicians from DB
    const technicians = await User.find({
      _id: { $in: techIds },
      role: 'technician',
      status: 'active'
    }).select('_id name email fcmTokens');

    let notifiedCount = 0;

    for (const tech of technicians) {
      const count = techCountsMap[tech._id.toString()] || 0;
      if (count > 0) {
        const title = 'Assigned Tickets';
        const body = `${tech.name} you have ${count} of tickets assigned`;
        
        await sendPushNotification(
          tech._id.toString(),
          title,
          body,
          {
            type: 'assigned_tickets_daily',
            count: String(count)
          }
        );
        notifiedCount++;
      }
    }

    console.log(`[Cron Job] Completed: Sent daily assigned ticket notifications to ${notifiedCount} technician(s) for ${assignedTickets.length} assigned ticket(s).`);
    return { techniciansNotified: notifiedCount, totalAssignedTickets: assignedTickets.length };
  } catch (error) {
    console.error('[Cron Job Error] Failed to send daily assigned ticket notifications:', error.message);
    throw error;
  }
};

/**
 * Initializes cron jobs for the backend server
 */
const initCronJobs = () => {
  // Schedule everyday at 10:00 AM (0 10 * * *) in Indian Standard Time (IST)
  cron.schedule('0 10 * * *', async () => {
    await sendDailyAssignedTicketNotifications();
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });

  console.log('[Cron Service] Scheduled daily 10:00 AM technician assigned ticket notifications (Asia/Kolkata).');
};

module.exports = {
  initCronJobs,
  sendDailyAssignedTicketNotifications
};
