/*
* Taking the request time and response time from database
* Checking if the difference of those is exceeding the threshold limit
* If the result exceeds the threshold limit put it to spreadsheet
*
*/
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

/**
* Winston logger
* A multi-transport async logging library for node.js.
* 
*/
var logger = require('winston');
/**
* Winston logger to log daily basis
*/
logger.add(logger.transports.DailyRotateFile, {datePattern:'.yyyy-MM-dd', filename: 'newlogs.log'});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var DBIDArray = new Array();
var DBKeyArray = new Array();
var responseTimeFromDB = new Array();
var requestTimeFromDB = new Array();
var dataCount = 0;

/**
* nano a minimalistic couchdb driver for node.js
* [...]
*/
var nano = require('nano')('http://harish:1234@127.0.0.1:5984');
var test_cdb = nano.db.use('test_cdb');

/**
* Using db.list function to traverse to database 
*  
* [...]
*/
test_cdb.list(function(err, body) {
  if (!err) {
    body.rows.forEach(function(doc) {
        
      test_cdb.get(doc.id, function(err, buffer) {
      if (!err) {
        /**
        * 
        * Check the threshold limt
        *
        */
            if((buffer.res_time-buffer.req_time) > 2){
               // console.log("Message has to be sent to cell");
                {
                    DBIDArray[dataCount] = doc.id;
                    DBKeyArray[dataCount] = doc.key;
                    requestTimeFromDB[dataCount] = buffer.req_time;
                    responseTimeFromDB[dataCount] = buffer.res_time;
                }
                //console.log("array length : "+DBIDArray.length);
                dataCount++;
            }
            else{
               // console.log("There is no problem..:) You can continue..")
            }
        }
        });
    });
  }
});

/**
*@private
*/
var Spreadsheet = require('edit-google-spreadsheet');
Spreadsheet.load({
    debug: true,

    /**
    * Here in place of spreadsheet name and work sheet name I have used their ID's 
    */
    spreadsheetId: "1roaLPNIi0pNfxCfjOZEjsKFit8Xo-62jHhy3YGF-_1Q",
    worksheetId: "od6",

   /**
   * OAuth Authentication for accessing spreadsheet
   * (Here I have used my gmail account's spreadsheet authentication details
   * You have to use yours by setting up google service account)
   */
    oauth : {
      email: '825480284253-9egbgu9jq55obdt6iroqr1orlsdi488p@developer.gserviceaccount.com',
      keyFile: 'myproject.pem'
    }
  },function sheetReady(err, spreadsheet) 
  {
    //use speadsheet!
    if(err) {
        console.log("error while adding data : ", err);
        return;
    }
          
    /**
    Adding first column to spreadsheet
    */
    var idcount = 0;
    for (var sheetRowCount = 2; sheetRowCount <= DBIDArray.length+1; sheetRowCount++) 
    {         
            var sheetRowData = {};
            sheetRowData[sheetRowCount] = {};
            var sheetColumnCount = 1;
            sheetRowData[sheetRowCount][sheetColumnCount] = DBIDArray[idcount++];
            //console.dir(sheetRowData);
            spreadsheet.add(sheetRowData);
            logger.log('info', 'Sperad Sheet updated row: '+sheetRowCount+ ' and column: '
                +sheetColumnCount);
    }

    // Adding second column to spreadsheet
    var keycount = 0;
    for (var sheetRowCount = 2; sheetRowCount <= DBIDArray.length+1; sheetRowCount++) 
    {
            var sheetRowData = {};
            sheetRowData[sheetRowCount] = {};
            var sheetColumnCount = 2;
            sheetRowData[sheetRowCount][sheetColumnCount] = DBKeyArray[keycount++];
            //console.dir(sheetRowData);
            spreadsheet.add(sheetRowData);
            logger.log('info', 'Sperad Sheet updated row: '+sheetRowCount+ ' and column: '
                +sheetColumnCount);
    }

    // Adding third column to spreadsheet
    var reqKeyCount = 0;
    for (var sheetRowCount = 2; sheetRowCount <= DBIDArray.length+1; sheetRowCount++) 
    {
            var sheetRowData = {};
            sheetRowData[sheetRowCount] = {};
            var sheetColumnCount = 3;
            sheetRowData[sheetRowCount][sheetColumnCount] = requestTimeFromDB[reqKeyCount++];
            //console.dir(sheetRowData);
            spreadsheet.add(sheetRowData);
            logger.log('info', 'Sperad Sheet updated row: '+sheetRowCount+ ' and column: '
                +sheetColumnCount);
    }

    // Adding fourth column to spreadsheet
    var resKeycount = 0;
    for (var sheetRowCount = 2; sheetRowCount <= DBIDArray.length+1; sheetRowCount++) 
    {
            var sheetRowData = {};
            sheetRowData[sheetRowCount] = {};
            var sheetColumnCount = 4;
            sheetRowData[sheetRowCount][sheetColumnCount] = responseTimeFromDB[resKeycount++];
            //console.dir(sheetRowData);
            spreadsheet.add(sheetRowData);
            logger.log('info', 'Sperad Sheet updated row: '+sheetRowCount+ ' and column: '
                +sheetColumnCount);
    }
    
    spreadsheet.send(function(err) {
      if(err) {
        console.log("error while sending : ",err);
        throw err;
       }
      console.log("");
    });

  }
);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
