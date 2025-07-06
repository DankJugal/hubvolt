const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;

const hubvolt = require('./router/hubVolt');
const db = require('./config/hubvolt');
const logger = require('./logger');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text());

// Routes
app.use('/hubvolt', hubvolt);

// Start server
app.listen(PORT, () => {
  logger.info(`Server started and listening on port ${PORT}`);
});

// Helper function for retry delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Echo ping function
const echoAllDevices = async () => {
  const DEVICE_QUERY = `
    SELECT device_name, device_ip_address 
    FROM devices 
    WHERE device_status IS NULL OR device_status = 'online'
  `;

  db.query(DEVICE_QUERY, async (err, results) => {
    if (err) {
      logger.error(`Error fetching devices from database: ${err.message}`);
      return;
    }

    if (!results || results.length === 0) {
      return;
    }

    logger.info(`Fetched ${results.length} devices to perform echo checks.`);

    const tryEcho = async (device, attempt = 1) => {
      const { device_name, device_ip_address } = device;

      try {
        logger.info(`Sending echo to ${device_name} at ${device_ip_address} (Attempt ${attempt})`);

        const response = await axios.post(
          `http://${device_ip_address}/`,
          'ECHO XYZ',
          { headers: { 'Content-Type': 'text/plain' }, timeout: 5000 }
        );

        if (response.data && typeof response.data === 'string') {
          const UPDATE_QUERY = `
            UPDATE devices 
            SET device_status = 'online'
            WHERE device_name = ?`;

          db.query(UPDATE_QUERY, [device_name], (err) => {
            if (err) {
              logger.error(`Failed to update status to 'online' for ${device_name}: ${err.message}`);
            } else {
              logger.info(`Echo successful. Device '${device_name}' is marked as ONLINE.`);
            }
          });
        } else {
          throw new Error('Invalid response data from device');
        }

      } catch (error) {
        logger.warn(`Echo failed for ${device_name} at ${device_ip_address} on attempt ${attempt}: ${error.message}`);

        if (attempt === 1) {
          logger.info(`Retrying echo to ${device_name} after 1 second delay...`);
          await delay(1000);
          await tryEcho(device, 2);
        } else {
          const UPDATE_QUERY = `
            UPDATE devices 
            SET device_status = 'offline', device_last_connected = NOW(), device_port_status = 'OFF'
            WHERE device_name = ?`;

          db.query(UPDATE_QUERY, [device_name], (err) => {
            if (err) {
              logger.error(`Failed to mark ${device_name} as OFFLINE: ${err.message}`);
            } else {
              logger.warn(`Device '${device_name}' is marked as OFFLINE after 2 failed attempts.`);
            }
          });
        }
      }
    };

    const promises = results.map((device) => tryEcho(device));
    await Promise.allSettled(promises);

    logger.info('Device echo check cycle completed.\n');
  });
};

// Schedule echo check every 60 seconds
setInterval(echoAllDevices, 60 * 1000);
