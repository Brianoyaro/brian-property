const express = require('express');
const connection = require('../config/database');
const router = express.Router();

// list all available properties
router.get('/properties', async (req, res) => {
    await connection.query('SELECT * FROM properties', (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).json(results);
        }
    });
}
);

// view a specific property
router.get('/properties/:id', async (req, res) => {
    const id = req.params.id;
    await connection.query('SELECT * FROM properties WHERE id = ?', [id], (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).json(results);
        }
    });
}
);

// all images associated with a property
router.get('/properties/:id/images', async (req, res) => {
    const id = req.params.id;
    await connection.query('SELECT * FROM property_images WHERE property_id = ?', [id], (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).json(results);
        }
    });
}
);

module.exports = router;