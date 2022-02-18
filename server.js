const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const PORT = process.env.PORT || 4000;
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(cors());

app.set('appSecret', 'secretforinvoicingapp'); // this will be used later


app.get('/', function(req, res) {
    res.send('Welcome to Invoicing App.');
  });
 
const _ = require('lodash');

const multer  = require('multer');
const upload = multer();

const bcrypt = require('bcrypt');
const saltRounds = 10;



// POST /register - begin
// Create middleware for protecting routes
app.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    let token =
      req.body.token || req.query.token || req.headers["x-access-token"];
    // decode token
    if (token) {
      // verifies secret and checks exp
      jwt.verify(token, app.get("appSecret"), function(err, decoded) {
        if (err) {
          return res.json({
            success: false,
            message: "Failed to authenticate token."
          });
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          next();
        }
      });
    } else {
      // if there is no token
      // return an error
      return res.status(403).send({
        success: false,
        message: "No token provided."
      });
    }
  });
app.post('/register', multipartMiddleware, function(req, res) {
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
                      let user_id = this.lastID;
                      let query = `SELECT * FROM users WHERE id='${user_id}'`;
                      db.all(query, [], (err, rows) => {
                        if (err) {
                          throw err;
                        }
                        let user = rows[0];
                        delete user.password;
                        //  create payload for JWT
                        const payload = {
                          user: user 
                        }
                        // create token
                        let token = jwt.sign(payload, app.get("appSecret"), {
                          expiresInMinutes: "24h" // expires in 24 hours
                        });
                        // send response back to client
                        return res.json({
                          status: true,
                          token : token
                        });
                      });
                    }
                  });
                  db.close();
                });
              });
              



// POST /register - end


// POST /login - begin
// Create middleware for protecting routes
app.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    let token =
      req.body.token || req.query.token || req.headers["x-access-token"];
    // decode token
    if (token) {
      // verifies secret and checks exp
      jwt.verify(token, app.get("appSecret"), function(err, decoded) {
        if (err) {
          return res.json({
            success: false,
            message: "Failed to authenticate token."
          });
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          next();
        }
      });
    } else {
      // if there is no token
      // return an error
      return res.status(403).send({
        success: false,
        message: "No token provided."
      });
    }
  });
app.post('/login', multipartMiddleware, function(req, res) {
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
  
  

  let user = rows[0];

  let authenticated = bcrypt.compareSync(req.body.password, user.password);

  delete user.password;

  if (authenticated) {
    //  create payload for JWT
    const payload = { user: user };
    // create token
    let token = jwt.sign( payload, app.get("appSecret"),{
      expiresIn: "24h" // expires in 24 hours
    });
    return res.json({
      status: true,
      token: token
    });
  }
  
  return res.json({
    status: false,
    message: "Wrong Password, please retry"
  });
});
});

// POST /login - end



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
  
  let nodemailer = require('nodemailer')
    
  // create mail transporter
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'COMPANYEMAIL@gmail.com',
      pass: 'userpass'
    }
  });

    // configure app routes
    
    app.post("/sendmail", multipartMiddleware, function(req, res) {
      // get name  and email of sender
      let sender = JSON.parse(req.body.user);
      let recipient = JSON.parse(req.body.recipient);
      let mailOptions = {
        from: "COMPANYEMAIL@gmail.com",
        to: recipient.email,
        subject: `Hi, ${recipient.name}. Here's an Invoice from ${
          sender.company_name
        }`,
        text: `You owe ${sender.company_name}`
      };
      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          return res.json({
            status: 200,
            message: `Error sending main to ${recipient.name}`
          });
        } else {
          return res.json({
            status: 200,
            message: `Email sent to ${recipient.name}`
          });
        }
      });
    });



  

app.listen(PORT, function() {
    console.log(`App running on localhost:${PORT}.`);
  });