"use strict";
const path = require('path');
const Promise = require('bluebird');
const sqlite3 = require('sqlite3');

// ...
// ...

module.exports = {
    up: function() {
      return new Promise(function(resolve, reject) {
        let db = new sqlite3.Database('./database/InvoicingApp.db');
  
        db.run(`PRAGMA foreign_keys = ON`);
  
        // ...
  