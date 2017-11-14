//authorizer.js
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const JSUtils = require ('../utils/jsutils');
const w = require('../utils/logger');

/* paradigm: exceptions => catch(err), data errors => callback(err) */
class Authorizer {
  constructor(){
    this.numberOfSaltRounds = parseInt(process.env.PRF_SALT_ROUNDS) || 16;
    this.JWTSecretKey = process.env.PRF_JWT_SECRET;
    this.JWTDurationTillExpiry = parseInt(process.env.PRF_JWT_DURATION) || 1800;

    //bind local methods
    this.validateCredentials = this.validateCredentials.bind(this);
    this.validateSignup = this.validateSignup.bind(this);
    this.validateSession = this.validateSession.bind(this);
  }

  validateCredentials (req, res, next) {
    w.debug("Authorizer::validateCredentials");
    const UserProfileDAO = req.app.locals.UserProfileDAO;    
    let profileObj = req.body;
    
    //get the user
    let scope = this;
    UserProfileDAO.authByUsername(profileObj, function(err, response){
      if(err) {
        w.debug("Authorizer::validateCredentials : user not found");
        res.status(401).json({ message: 'Bad Credentials'});
      } else {
        w.debug("Authorizer::validateCredentials : user found");
        let matchedUser = response;
        let hashedpwd = response.password;
        delete matchedUser.password; //dont send back to client

        //compare password hashes
        bcrypt.compare(profileObj.password, hashedpwd).then(function(response){
          if(response==true){
            //create JWT token - signs with HS256 by default
            let token =  jsonwebtoken.sign( matchedUser, scope.JWTSecretKey, {expiresIn:scope.JWTDurationTillExpiry} );
            req.token = token;
            res.json({ prf_authtoken:req.token, message: 'OK'});               
          } else {
            res.status(401).json({ message: 'Bad Credentials'});    
          }
        }).catch(function(err){
          next(err);
        });
      }//end else found a matching user
    });//end find by username
  }

  validateSignup (req, res, next) {
    w.debug("Authorizer::validateSignup");
    const UserProfileDAO = req.app.locals.UserProfileDAO;    
    let profileObj = req.body;

    // >>> last sanity checks (all synchronous): we don't presume anything about what the frontend is checking.
    try {
      if(Object.keys(profileObj).length === 0) throw new Error('No profile data submitted!');
      if(profileObj.username.indexOf(' ') !== -1) throw new Error('Invalid user data');
      if(profileObj.password.indexOf(' ') !== -1) throw new Error('Invalid user data');
      if(profileObj.email.indexOf(' ') !== -1) throw new Error('Invalid user data');
      if(profileObj.username.length === 0) throw new Error('Invalid user data');
      if(profileObj.password.length === 0) throw new Error('Invalid user data');
      if(profileObj.email.length === 0) throw new Error('Invalid user data');

      if( !JSUtils.validateEmail(profileObj.email) ) throw new Error('Invalid user data');
    } catch (err) {
      next(err);
      return;
    }
    // <<< 

    //ensure username is unique for all signups:
    let scope = this;
    UserProfileDAO.authByUsername(profileObj, function(err, response){
      if(!err) {
        next(err);
        return;
      }
      w.debug("Authorizer::validateSignup : username is unique");
     
      //unique username and everything else is okay; lets move on to encrypting the hashes
      //maximum input length for bcrypt is 72 bytes. Wouldve liked to check len with new Blob() type, e.g.
      //new Blob(["字"]).size; //3! Alas, too shiny, too new...
      //...

      //salt and hash the password
      bcrypt.genSalt(scope.numberOfSaltRounds, function(err, theSalt) {
        if(err) {
          next(err);
          return;
        }
        bcrypt.hash(profileObj.password, theSalt, function(err, hash) {
            if(err) {
              next(err);
              return;
            }
            let finalProfile = Object.assign(profileObj, {password:hash});
            w.debug('**** finalProfile :', finalProfile);
            req.finalProfile = finalProfile;
            next();
        });
      });
    });
  }

  validateSession (req, res, next) {
    w.debug("Authorizer::validateSession"); 
    let token;
    
    //grab the token from the auth header
    try {
      if (req.headers.authorization) {
        w.debug(req.headers.authorization);
        let authHeaderParts = req.headers.authorization.split(' ');
        if( (authHeaderParts[0]=='Bearer') ) {
          token = authHeaderParts[1];
          w.debug("Authorizer::validateSession - token: ", token);
        } else {
          res.status(403).json({ message: 'Bad bearer token.' });
          return;
        }
      } else {
        res.status(403).json({ message: 'Bad auth header.' });
        return;
      }
    } catch (err) {
      w.debug(err);
      next(err);
      return;
    }

    //verify the token
    jsonwebtoken.verify(token, this.JWTSecretKey, function(err, decoded) {      
      if (err) {
        w.debug("Authorizer::validateSession - jsonwebtoken.verify Failed");
        w.debug(err);
        res.status(403).json({ message: 'Invalid token' });
        return;    
      } else {
        w.debug("Authorizer::validateSession - jsonwebtoken.verify OK");
        w.debug(decoded);
        req.decodedToken = decoded;    
        next();
      }
    });
  }

  validatePermissions (req, res, next) {
    //TODO: future roles and permissions (eg admin, power users, readonly users etc)
    next();
  }

  //TODO: graceful session extension....
}

module.exports = Authorizer;