const schedule = require('node-schedule');
const db = require('../database');
const whatsappService = require('./whatsappService');

/**
 * Service that manages scheduling of WhatsApp messages. Jobs are stored in
 * memory and keyed by schedule id. On startup, any unsent schedules
 * persisted in the database are loaded and scheduled.
 */
class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Schedule a message based on a schedule record from the database.
   * @param {Object} scheduleRecord
   */
  scheduleMessage(scheduleRecord) {
    const { id, message, send_at, group_name, numbers } = scheduleRecord;
    if (this.jobs.has(id)) {
      // Cancel existing job if rescheduling
      this.jobs.get(id).cancel();
      this.jobs.delete(id);
    }
    const sendDate = new Date(send_at);
    // Do not schedule past dates
    if (sendDate <= new Date()) {
      return;
    }
    const job = schedule.scheduleJob(sendDate, async () => {
      try {
        let targetNumbers = [];
        if (group_name) {
          targetNumbers = db.getNumbersByGroup(group_name).map(n => n.number);
        } else if (numbers) {
          try {
            const list = JSON.parse(numbers);
            targetNumbers = list;
          } catch (e) {
            console.error('Failed to parse numbers JSON:', e);
          }
        }
        // Remove duplicates
        targetNumbers = [...new Set(targetNumbers)];
        for (const num of targetNumbers) {
          try {
            await whatsappService.sendMessage(num, message);
            console.log(`Sent message to ${num}`);
          } catch (err) {
            console.error('Failed to send message to', num, err);
          }
        }
        // Mark as sent
        db.markScheduleSent(id);
      } finally {
        // Remove job after execution
        this.jobs.delete(id);
      }
    });
    this.jobs.set(id, job);
  }

  /**
   * Cancel a scheduled job and remove from internal map.
   * @param {number} id
   */
  cancelSchedule(id) {
    const job = this.jobs.get(id);
    if (job) {
      job.cancel();
      this.jobs.delete(id);
    }
  }

  /**
   * Resume all unsent schedules on startup. Should be called once during
   * application initialization after the database has been initialized.
   */
  resumeSchedules() {
    const schedules = db.getAllSchedules();
    schedules.forEach(sched => {
      if (!sched.sent) {
        this.scheduleMessage(sched);
      }
    });
  }
}

module.exports = new SchedulerService();