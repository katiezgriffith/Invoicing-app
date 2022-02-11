const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const PORT = process.env.PORT || 3128;

const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(cors());

// ...
// ...

app.get('/', function(req, res) {
    res.send('Welcome to Invoicing App.');
  });
 
  
// ...

app.listen(PORT, function() {
    console.log(`App running on localhost:${PORT}.`);
  });
  