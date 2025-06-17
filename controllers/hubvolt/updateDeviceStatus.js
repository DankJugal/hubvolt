const axios = require('axios');
const db = require('../../config/hubvolt');

const updateDeviceStatus = async (req, res) => {
  const { device_name, status } = req.params;
  const statusUpper = status.toUpperCase();

  if (statusUpper !== 'ON' && statusUpper !== 'OFF') {
    return res.status(400).send('Status must be ON or OFF');
  }

  try {
    const DEVICE_QUERY = `SELECT device_ip_address FROM devices WHERE device_name = ?`;
    const [rows] = await db.promise().query(DEVICE_QUERY, [device_name]);

    if (!rows.length) {
      return res.status(404).send('Device not found');
    }

    const device_ip = rows[0].device_ip_address;

    try {
      const response = await axios.post(
        `http://${device_ip}/`,
        `CONTROL ${statusUpper}`,
        {
          headers: { 'Content-Type': 'text/plain' },
          timeout: 10000
        }
      );

      const espResponse = (response.data || '').trim().toUpperCase();
      console.log(`Response from ${device_name}:`, espResponse);

      const parts = espResponse.split(/\s+/); // split by whitespace
      const returnedStatus = parts[1]; // assume second word is status

      if (returnedStatus === 'ON' || returnedStatus === 'OFF') {
        const UPDATE_QUERY = `UPDATE devices SET device_port_status = ? WHERE device_name = ?`;
        await db.promise().query(UPDATE_QUERY, [returnedStatus, device_name]);
        return res.status(200).send(`Device port status updated to ${returnedStatus}`);
      } else {
        return res.status(500).send('Unexpected response format from device');
      }

    } catch (err) {
      console.error(`Error sending CONTROL to ${device_name}:`, err.message);
      return res.status(500).send('Failed to control device');
    }

  } catch (err) {
    console.error('Error in updateDeviceStatus:', err.message);
    return res.status(500).send('Server error');
  }
};

module.exports = updateDeviceStatus;
