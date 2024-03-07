//F:\app_thu_phi\be\src\config\app.js
import app from './config/app.js';

import { getConnection } from './database/connection.js';

getConnection();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
    }
);