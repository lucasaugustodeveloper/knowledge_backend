require('dotenv').config();
const app = require('express')();
const consign = require('consign');
const mongoose = require('mongoose');
const db = require('./config/db');

require('./config/mongodb');

app.db = db;
app.mongoose = mongoose;

consign()
  .include('./config/passport.js')
  .then('./config/middlewares.js')
  .then('./api/validation.js')
  .then('./api')
  .then('./schedule')
  .then('./config/routes.js')
  .into(app);

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
