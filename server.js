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
  

  // ...

const _ = require('lodash');

const multer  = require('multer');
const upload = multer();

const bcrypt = require('bcrypt');
const saltRounds = 10;

// POST /register - begin

app.post('/register', upload.none(), function(req, res) {
  // check to make sure none of the fields are empty
  if (
    _.isEmpty(req.body.name)
    || _.isEmpty(req.body.email)
    || _.isEmpty(req.body.company_name)
    || _.isEmpty(req.body.password)
  ) {
    return res.json({
      "status": false,
      "message": "All fields are required."
    });
  }

  // any other intended checks

// ...

bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

    let db = new sqlite3.Database('./database/InvoicingApp.db');

    let sql = `INSERT INTO
                users(
                  name,
                  email,
                  company_name,
                  password
                )
                VALUES(
                  '${req.body.name}',
                  '${req.body.email}',
                  '${req.body.company_name}',
                  '${hash}'
                )`;

    db.run(sql, function(err) {
      if (err) {
        throw err;
      } else {
        return res.json({
          "status": true,
          "message": "User Created."
        });
      }
    });

    db.close();
  });

});

// POST /register - end
// ...

// POST /login - begin

app.post('/login', upload.none(), function(req, res) {
    let db = new sqlite3.Database('./database/InvoicingApp.db');
  
    let sql = `SELECT * from users where email='${req.body.email}'`;
  
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
  
      db.close();
  
      if (rows.length == 0) {
        return res.json({
          "status": false,
          "message": "Sorry, wrong email."
        });
      }
  
  // ...
  // ...

  let user = rows[0];

  let authenticated = bcrypt.compareSync(req.body.password, user.password);

  delete user.password;

  if (authenticated) {
    return res.json({
      "status": true,
      "user": user
    });
  }

  return res.json({
    "status": false,
    "message": "Wrong password. Please retry."
  });
});

});

// POST /login - end

// ...

