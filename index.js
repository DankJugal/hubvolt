const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;

const hubvolt = require('./router/hubVolt');
const db = require('./config/hubvolt');

app.use(cors());
app.use(express.json());
app.use(express.text());

app.use('/hubvolt', hubvolt);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ECHO ALL DEVICES FUNCTION
const echoAllDevices = async () => {
  const DEVICE_QUERY = `SELECT device_name, device_ip_address FROM devices`;

  db.query(DEVICE_QUERY, async (err, results) => {
    if (err || !results || results.length === 0) {
      console.error('Error fetching devices or no devices found:', err || 'Empty list');
      return;
    }

    const promises = results.map((device) => {
      return axios.post(
        `http://${device.device_ip_address}/`,
        'ECHO XYZ',
        { headers: { 'Content-Type': 'text/plain' }, timeout: 10000 }
      )
      .then((response) => {
        if (response.data && typeof response.data === 'string') {
          const UPDATE_QUERY = `
            UPDATE devices 
            SET device_status = 'online', device_last_connected = NOW()
            WHERE device_name = ?`;
          db.query(UPDATE_QUERY, [device.device_name]);
          console.log(`Echo from ${device.device_name}: ${response.data}`);
        } else {
          const UPDATE_QUERY = `
            UPDATE devices 
            SET device_status = 'offline'
            WHERE device_name = ?`;
          db.query(UPDATE_QUERY, [device.device_name]);
          console.warn(`Empty response from ${device.device_name}`);
        }
      })
      .catch((err) => {
        const UPDATE_QUERY = `
          UPDATE devices 
          SET device_status = 'offline'
          WHERE device_name = ?`;
        db.query(UPDATE_QUERY, [device.device_name]);
        console.error(`Error from ${device.device_name}:`, err.message);
      });
    });

    await Promise.allSettled(promises);
  });
};

// Schedule it every 60 seconds
setInterval(echoAllDevices, 60000);
