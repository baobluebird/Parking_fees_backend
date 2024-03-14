const express = require('express');
const app = express();
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const routes = require('./routes/api/api');
const { poolPromise } = require('./config/connection');

const cors = require('cors');
const bodyParser = require('body-parser');

const configViewEngine = require('./config/viewEngine');
dotenv.config();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.json());

routes(app);
configViewEngine(app);

const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });


app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    console.log('File uploaded:', req.file);
    const { typecar, location, address } = req.body;
    const imageFileName = req.file.filename;

    console.log('File uploaded:', imageFileName);
    console.log('Type of car:', typecar);
    console.log('Location:', location);
    console.log('Address:', address);

    const formData = new FormData();
    formData.append('image', fs.createReadStream(path.join(uploadDirectory, imageFileName)));
    const uploadImageURL = 'http://103.188.243.119:5000/upload-image';
    const response = await axios.post(uploadImageURL, formData, {
      headers: {
        ...formData.getHeaders() 
      },
    });

    console.log('Server response:', response.data);
    if(response.data.detections === '') {
      return res.status(200).json({ status: 'error', message: 'No car detected' });
    }
    res.status(200).json({ status: 'success', message: 'Upload successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
