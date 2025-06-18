const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;
const hubvolt = require('./router/hubVolt');
const authRoutes = require('./router/authRoute');
const db = require('./config/hubvolt');
app.use(express.json());
app.use(express.text());

app.use('/', authRoutes);
app.use('/hubvolt', hubvolt);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Echo check for all devices every 60 seconds
setInterval(() => {
  const DEVICE_QUERY = `SELECT device_name, device_ip_address FROM devices`;
  
  db.query(DEVICE_QUERY, async (err, results) => {
    if (err) {
      console.error('Error fetching devices:', err);
      return;
    }
    if (!results || results.length === 0) {
      console.log('No devices found in the database.');
      return;
    }
    for (const device of results) {
      try {
        const response = await axios.post(
          `http://${device.device_ip_address}/`,
          'ECHO XYZ',
          { headers: { 'Content-Type': 'text/plain' }, timeout: 10000 }
        );
        if (!response.data) {
          const UPDATE_QUERY = `UPDATE devices SET device_status = 'offline', device_last_connected = NOW() WHERE device_name = ?`;
          db.query(UPDATE_QUERY, [device.device_name], (err) => {
            if (err) {
              console.error(`Error updating device_last_connected for ${device.device_name}:`, err.message);
            } else {
              console.log(`device_last_connected updated for ${device.device_name} due to empty response.`);
            }
          });
        } else {
          console.log(`Echo response from ${device.device_name}:`, response.data);
        }
      } catch (err) {
        const UPDATE_QUERY = `UPDATE devices SET device_status = 'offline', device_last_connected = NOW() WHERE device_name = ?`;
        db.query(UPDATE_QUERY, [device.device_name], (updateErr) => {
          if (updateErr) {
            console.error(`Error updating device_last_connected for ${device.device_name}:`, updateErr.message);
          } else {
            console.log(`device_last_connected updated for ${device.device_name} due to echo failure.`);
          }
        });
        console.error(`Error echoing ${device.device_name}:`, err.message);
      }
    }
  });
}, 60000);