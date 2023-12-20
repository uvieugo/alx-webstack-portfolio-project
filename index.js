const dotenv = require('dotenv').config();
const App = require('./bin/app');

let app = new App(parseInt(process.env.FETCH_INT), parseInt(process.env.SERVER_PORT));
app.start();