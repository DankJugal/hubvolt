const db = require('../../config/hubvolt');

const updateDevice = async (req, res) => {
    const deviceName = req.params.device_name;
    const FIND_DEVICE_QUERY = "SELECT * FROM devices WHERE device_name = ?";
    db.query(FIND_DEVICE_QUERY, [deviceName], (err,results)=>{
        if(err){
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }
        if (results.length === 0) {
            return res.status(404).send('Device not found');
        }

        const device = results[0];
        const { device_port_status } = req.body;

        if (!device_port_status) {
            return res.status(400).send('Missing required fields');
        }

        const UPDATE_DEVICE_QUERY = `
            UPDATE devices
            SET device_port_status = ?
            WHERE device_name = ?
        `;

        db.query(UPDATE_DEVICE_QUERY, [device_port_status, deviceName], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error');
            }

            if (results.affectedRows === 0) {
                return res.status(404).send('Device not found');
            }

            return res.status(200).send('Device updated successfully');
        });
    });

};

module.exports = updateDevice;