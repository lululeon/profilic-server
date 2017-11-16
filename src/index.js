//server.js
require('dotenv').config();
//======== core imports =========
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

//======== app-specific imports =========
const mongobootstrap = require('./dao/bootstrapdata');
const udao = require('./dao/userprofile-dao');
const apiRouter = require('./middleware/api-routes');
const w = require('./utils/logger'); //winston logger config

//===== pick up any env settings:
//good practice to do the following, since in cloud deployment environments you may well be _given_ the port #.
const PORT = process.env.PORT || process.env.PRF_PORT; // || 3000;

//===== router declarations / imports
//var svrSocket = require( '../../src/middleware/socket-services' ); //for later

module.exports = {
  configureExpressApp : function(expressApp, inlineMode=false) {
    //======= Express App config.
    expressApp.use(bodyParser.urlencoded({ extended: true })); //everything incuding the payload in POSTS will be urlencoded for simplicity.
    expressApp.use(bodyParser.json()); //get middleware that parses json http bodys, for use by our express app
    
    //======= Mount the serverside routers (client-side taken care of by react-router-dom).
    expressApp.use('/api/v1', apiRouter);
    expressApp.use(function (err, req, res, next) {
      //this is the generic, catch-all error handler
      res.status(500).render('error', { message: 'An Internal Error occured in Profilic Server.' });
    });
  
    //======= Connect to DB
    if(inlineMode){
      w.info('profilic::Server ============= Running in INLINE MODE ============');
      mongobootstrap.dbsetup(function (err) {
        if (err) {
          w.error('profilic::Server Cannot start inline server due to mongodb connection error');
          return(false);
        }
        expressApp.locals.UserProfileDAO = new udao(mongobootstrap.getDBConn());
      });
    }
  
    //Got this far, all is well:
    return(true);
  },

  runServer : function() {
    //setup
    this.configureExpressApp(app);
  
    //======= final http Server config.  DO THIS CONFIG STEP LAST, after all config for express 'app' complete
    const server = require('http').createServer(app); //use our express server to also create a websocket server endpoint
    //const io = require('socket.io')(server); //give the server endpoint to socket.io
  
    //======= STARTUP!!
    w.info('profilic::Server %%%%%%%%%% PROFILIC SERVER | STARTING %%%%%%%%%');
  
    //======== get a db connection and set up the server:
    mongobootstrap.dbsetup(function (err) {
      if (err) {
        w.error('profilic::Server Cannot start server due to mongodb connection error');
        process.exit(1);//nothing left to throw the error to, so gracefully quit.
      }
  
      //store the db connecton (re app.locals: see http://expressjs.com/en/api.html#app.locals)
      //reason: best practice to keep a single shared connection for lifetime of app; don't be opening and closing connections
      app.locals.UserProfileDAO = new udao(mongobootstrap.getDBConn());
  
      w.info('profilic::Server MONGODB checks complete');
  
      //later:use sockets to handle data requests
      //svrSocket.defineProtocols(io, mongobootstrap.getDBConn() );
      //console.log(" %%%%%%%%%%%%%%%% SERVER :: Sockets ready  %%%%%%%%%%%%% ");
  
      // listen for term / kill signals 
      process.on('SIGTERM', function () {
        mongobootstrap.closeDBConn();
        process.exit();
      });
      process.on('SIGKILL', function () {
        mongobootstrap.closeDBConn();
        process.exit();
      });
  
      // listen for interrupts e.g. Ctrl-C
      process.on('SIGINT', function () {
        mongobootstrap.closeDBConn();
        process.exit();
      });
  
      server.listen(PORT);
      w.info('profilic::Server Up and running on port ' + PORT);
    });
  }
};
