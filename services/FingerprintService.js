const ZKLib = require('node-zklib');

class FingerprintService {
  constructor() {
    this.instance = null;
    this.connected = false;
    this.config = {
      ip: '192.168.1.201',
      port: 4370,
      timeout: 10000,
      inport: 4370
    };
  }

  async connect(ip = this.config.ip, port = this.config.port) {
    try {
      this.instance = new ZKLib(ip, port, this.config.timeout, this.config.inport);
      await this.instance.createSocket();
      this.connected = true;
      console.log('Connected to Fingerprint Device:', ip);
      return { success: true, message: 'Connected successfully' };
    } catch (error) {
      this.connected = false;
      console.error('Connection Error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAttendanceLogs() {
    if (!this.connected) await this.connect();
    if (!this.instance) return { success: false, error: 'Device instance not initialized' };
    try {
      const logs = await this.instance.getAttendances();
      return { success: true, data: logs.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUsers() {
    if (!this.connected) await this.connect();
    try {
      const users = await this.instance.getUsers();
      return { success: true, data: users.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async disconnect() {
    if (this.instance) {
      try {
        await this.instance.disconnect();
        this.connected = false;
      } catch (error) {
        console.error('Disconnect Error:', error);
      }
    }
  }

  async setupRealTime(callback) {
    if (!this.connected) await this.connect();
    try {
      this.instance.getRealTimeLogs((data) => {
        callback(data);
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FingerprintService();
