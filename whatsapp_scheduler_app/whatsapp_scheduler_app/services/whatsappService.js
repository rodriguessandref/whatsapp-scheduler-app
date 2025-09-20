const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

/**
 * Singleton service wrapping whatsapp-web.js client. When the application
 * starts for the first time, a QR code will be printed in the terminal for
 * authentication. Once scanned, a session is persisted locally via the
 * LocalAuth strategy so subsequent restarts do not require scanning again.
 */
class WhatsAppService {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: 'scheduler-app' }),
      puppeteer: { headless: true }
    });

    this.client.on('qr', qr => {
      console.log('QR code received, scan the following to authenticate:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready.');
    });

    this.client.on('authenticated', session => {
      console.log('WhatsApp authentication successful.');
    });

    this.client.on('auth_failure', msg => {
      console.error('WhatsApp authentication failed:', msg);
    });

    this.client.on('disconnected', reason => {
      console.log('WhatsApp client disconnected:', reason);
    });

    this.client.initialize();
  }

  /**
   * Sends a message to a given WhatsApp number. The number must include
   * country code (e.g. 5521999999999). Returns a promise.
   * @param {string} number
   * @param {string} message
   */
  async sendMessage(number, message) {
    const chatId = `${number}@c.us`;
    await this.client.sendMessage(chatId, message);
  }
}

module.exports = new WhatsAppService();