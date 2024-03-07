const express = require('express');
const app = express();
const dotenv = require('dotenv');
const routes = require('./routes/api/api');
//F:\app_thu_phi\be\src\config\connection.js
const {poolPromise} = require('./config/connection');
const cors = require('cors');
const bodyParser = require('body-parser');
const configViewEngine = require('./config/viewEngine');
dotenv.config();
const port = process.env.PORT || 3001;

app.use(cors())
app.use(express.json())
// app.use(express.urlencoded({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(express.static('public')) 
app.use(bodyParser.json()); 

routes(app);
configViewEngine(app); 

app.listen(port, () => {  
    console.log(`Server is running on port ${port}.`);
}); 
