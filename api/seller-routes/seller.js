// https://mahmudnotes.hashnode.dev/uploading-multiple-files-to-expressjs-backend-from-reactjs-frontend-using-rest-api


const express = require('express');
const connection = require('../config/database');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const uuid = require('uuid');


// set the upload limit, in this case I gave it 50 mb
// app.use(bodyparser.urlencoded({ limit: '50mb', extended: true }))
// app.use(cors()) // we are allowing every sites to send API call
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use('/uploads', express.static('uploads'));
// setting the upload folder as static folder

/*
    we are using multer.diskStoarge() to take the full control for 
    uploading files
*/
const storage = multer.diskStorage({
    // `cb` stands for callback
    destination: (req, file, cb) => {
        cb(null, './uploads/') 
        // cb(error, directory_name)
    },
    /*    
        destination function is a function to set the path for our files.
        in this case, we are using the folder "files". the "files" folder
        is located in our main directory.
    */
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        cb(null, uuid.v4() + extension);
    // giving the file name, here we are naming it with uuid.extension
    }
    /*
        filename function gives a filename for the uploaded file
    */
})

const upload = multer({ storage: storage })
// upload middleware

router.post('/properties/new', upload.array('image'), async (req, res) => {
    // cobfirm file upload to prevent server crush
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }
    const uploadedFiles = req.files.map((file) => `/uploads/${file.filename}`);
    // mapping through all of the files and setting file name for every files
    const { title, description, price, location, seller_id } = req.body;
    // getting the values from the body
    await connection.query('INSERT INTO properties (title, description, price, location, seller_id, image) VALUES (?, ?, ?, ?, ?, ?)', [title, description, price, location, seller_id, uploadedFiles[0]], (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
        const propertyId = results.insertId;
        const imageValues = uploadedFiles.map((image) => [propertyId, image]);
        connection.query('INSERT INTO property_images (property_id, image) VALUES (?, ?)', [imageValues], (error, results) => {
            if (error) {
                console.log(error);
                res.status(500).send('Internal Server Error');
            }
        });
        res.status(201).send('Property Added');
    });
})

// list all available properties
router.get('/properties', async (req, res) => {
    const { id } = req.query;
    await connection.query('SELECT * FROM properties where seller_id=?', [id], (error, results) => {
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

module.exports = router;