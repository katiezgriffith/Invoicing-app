const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const PORT = process.env.PORT || 4000;

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

// POST /invoice - begin

app.post('/invoice', upload.none(), function(req, res) {
    // validate data
    if (_.isEmpty(req.body.name)) {
      return res.json({
        "status": false,
        "message": "Invoice needs a name."
      });
    }
  
    // perform other checks
  
  // ...
  // ...

  // create invoice
  let db = new sqlite3.Database('./database/InvoicingApp.db');

  let sql = `INSERT INTO invoices(
                name,
                user_id,
                paid
              )
              VALUES(
                '${req.body.name}',
                '${req.body.user_id}',
                0
              )`;

// ...
// ...

db.serialize(function() {
    db.run(sql, function(err) {
      if (err) {
        throw err;
      }

      let invoice_id = this.lastID;

      for (let i = 0; i < req.body.txn_names.length; i++) {
        let query = `INSERT INTO
                      transactions(
                        name,
                        price,
                        invoice_id
                      ) VALUES(
                        '${req.body.txn_names[i]}',
                        '${req.body.txn_prices[i]}',
                        '${invoice_id}'
                      )`;

        db.run(query);
      }

      return res.json({
        "status": true,
        "message": "Invoice created."
      });
    });
  });

});
// POST /invoice - end

// ...
// ...

// GET /invoice/user/:user_id - begin

app.get('/invoice/user/:user_id', upload.none(), function(req, res) {
    let db = new sqlite3.Database('./database/InvoicingApp.db');
  
    let sql = `SELECT * FROM invoices WHERE user_id='${req.params.user_id}' ORDER BY invoices.id`;
  
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
  
      return res.json({
        "status": true,
        "invoices": rows
      });
    });
  });
  
  // GET /invoice/user/:user_id - end
  
  // ...
  

app.listen(PORT, function() {
    console.log(`App running on localhost:${PORT}.`);
  });