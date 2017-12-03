// ######################## ABANDON HOPE, ALL YE WHO ENTER HERE ##################
// this file is a tragic mess...
// and it's going to stay that way for a bit as I've other things to do.
// many routes that should logically be wrapped with auth aren't yet wrapped,
// because still bootstrapping functionality slowly.
/// ##############################################################################

//configuring API routes
const express = require('express');
const router = express.Router();
const Authorizer = require('./authorizer');
const w = require('../utils/logger');

//setup
const auth = new Authorizer();

// ####################################### GETS ###################################
//** GET ALL */
router.get('/profiles', (req, res) => {
  const UserProfileDAO = req.app.locals.UserProfileDAO;

  try {
    UserProfileDAO.getAllProfiles(function (err, docs) {
      if (err) throw (err);
      w.debug('profilic::apiRouter GET /profiles [' + docs.length + '] items retrieved');
      //TODO: enrich API by embedding API links to resources
      res.json({ profileList: docs, message: 'OK' });
    });
  } catch (err) {
    w.debug('profilic::apiRouter GET /profiles CATCH block');
    w.debug(err);
    //fail gracefully; don't send back nulls/undefineds.
    //and don't use res.sendStatus(nnn) because headers already sent shenanigans.
    res.status(500).json({ profileList: [], message: 'An error occurred' });
  }
});

router.get('/profiles/latest/:limit', (req, res) => {
  const UserProfileDAO = req.app.locals.UserProfileDAO;
  let queryLimit = parseInt(req.params.limit);
  if(typeof(queryLimit) !== 'number') {
    res.status(400).json({ message: 'Bad input data' });
  } else {
    UserProfileDAO.getLatestProfiles(queryLimit, function (err, docs) {
      if (err) {
        w.debug('profilic::apiRouter GET /profiles/latest/:limit ERROR');
        w.debug(err);
        res.status(500).json({ profileList: [], message: 'An error occurred' });
      } else {
        w.debug('profilic::apiRouter GET /profiles/latest/:limit [' + docs.length + '] items retrieved');
        res.json({ profileList: docs, message: 'OK' });
      }
    });
  }
});

//** GET BY USERNAME */
router.get('/profiles/:username', (req, res) => {
  const UserProfileDAO = req.app.locals.UserProfileDAO;
  let username = req.params.username;

  try {
    UserProfileDAO.findByUsername(username, function (err, response) {
      if (err) {
        res.status(401).json({ profile: null, message: 'Not found' });
        return;
      } else {
        w.debug('profilic::apiRouter GET /profiles/:username [' + username + ']');
        res.json({ profile: response, message: 'OK' });
      }
    });
  } catch (err) {
    w.debug('profilic::apiRouter GET /profiles/:username CATCH block');
    w.debug(err);
    res.status(500).json({ profile: null, message: 'An error occurred' });
  }
});

//** GET PROFILES BY FIELDNAME MATCH on list of values */
router.put('/profiles/filter/:fieldname', (req, res) => {
  const UserProfileDAO = req.app.locals.UserProfileDAO;
  let fieldname = req.params.fieldname;
  let valuelist = req.body;

  try {
    UserProfileDAO.findIn(fieldname, valuelist, function (err, response) {
      if (err) {
        res.status(401).json({ profileList: null, message: 'Not found' });
        return;
      } else {
        w.debug('profilic::apiRouter GET /profiles/filter/:fieldname');
        res.json({ profileList: response, message: 'OK' });
      }
    });
  } catch (err) {
    w.debug('profilic::apiRouter GET /profiles/filter/:fieldname CATCH block');
    w.debug(err);
    res.status(500).json({ profile: null, message: 'An error occurred' });
  }
});


// ####################################### CREATES ###################################
//** SIGNUP */
router.post('/profiles/signup', auth.validateSignup, signupHandler, apiErrorHandler);


// ####################################### UPDATES & SETS ###################################
//** CREATE LINK between existing profiles */
router.post('/profiles/link/', auth.validatePermissions, createLinkage, updateMultiple, apiErrorHandler);

//** REMOVE LINK between existing profiles */
router.delete('/profiles/link/', auth.validatePermissions, deleteLinkage, updateMultiple, apiErrorHandler);

//** UPDATE */
router.put('/profiles/update', auth.validatePermissions, (req, res) => {
  const UserProfileDAO = req.app.locals.UserProfileDAO;
  let profileObj = req.body;
  let id = profileObj._id;

  try {
    UserProfileDAO.updateProfile(profileObj, function (err, response) {
      if (err) throw (err);
      w.debug('profilic::apiRouter UPDATE /profiles/update - updated profile with id [' + id + ']');
      res.json({ profileList: [response], message: 'OK' });
    });
  } catch (err) {
    w.debug('profilic::apiRouter UPDATE /profiles/update CATCH block');
    w.debug(err);
    res.status(500).json({ profileList: [], message: 'An error occurred' });
  }
}, apiErrorHandler);

//** UPDATE micro */
router.put('/profiles/update/micro', auth.validatePermissions, (req, res) => {
  const UserProfileDAO = req.app.locals.UserProfileDAO;
  let profileObj = req.body;
  let id = profileObj._id;

  try {
    UserProfileDAO.updateProfileWithMicroResponse(profileObj, function (err, response) {
      if (err) throw (err);
      w.debug('profilic::apiRouter UPDATE /profiles/update/micro - updated profile with id [' + id + ']');
      res.json({ profileList: [response], message: 'OK' });
    });
  } catch (err) {
    w.debug('profilic::apiRouter UPDATE /profiles/update/micro CATCH block');
    w.debug(err);
    res.status(500).json({ profileList: [], message: 'An error occurred' });
  }
}, apiErrorHandler);


//** UPDATE multiple */
router.put('/profiles/updatelist', auth.validatePermissions, updateMultiple, apiErrorHandler);

// ####################################### AUTH & SECURITY ###################################
//** LOGIN */
router.put('/profiles/login', auth.validateCredentials, apiErrorHandler);

//** AUTH */
router.post('/profiles/auth', auth.validateSession, authHandler, apiErrorHandler);


//######################################### DELETES #########################################

//** DELETE */
router.delete('/profiles/:id', (req, res) => {
  const UserProfileDAO = req.app.locals.UserProfileDAO;
  let id = req.params.id;

  try {
    UserProfileDAO.deleteProfile(id, function (err, response) {
      if (err) throw (err);
      w.debug('profilic::apiRouter DEL /profiles/:id deleted profile with id [' + id + ']');
      res.json({ profileList: [], deletedCount: response.deletedCount, message: 'OK' });
    });
  } catch (err) {
    w.debug('profilic::apiRouter DEL /profiles/:id CATCH block');
    w.debug(err);
    res.status(500).json({ profileList: [], deletedCount: 0, message: 'An error occurred' });
  }
});


//#################### EXTERNALIZED ROUTER FUNCTION DEFINITIONS (these get hoisted) ##################
function apiErrorHandler(err, req, res, next) {
  w.debug('profilic::apiRouter::apiErrorHandler triggered');
  w.debug(err);
  res.status(500).json({ message: 'An error occurred' });
}

function signupHandler(req, res, next) {
  w.debug('profilic::apiRouter::signupHandler ...saving profile...:');
  const UserProfileDAO = req.app.locals.UserProfileDAO;
  let profileObj = req.finalProfile; //set by auth middleware
  //w.debug(profileObj);
  try {
    UserProfileDAO.signup(profileObj, function (err, response) {
      if (err) throw (err);
      w.debug('profilic::apiRouter::signupHandler created profile with id [' + response.insertedId + ']');
      let newProfile = response.ops[0];
      delete newProfile.password;
      res.json({ profileList: [newProfile], insertedCount: response.insertedCount, message: 'OK' });
    });
  } catch (err) {
    w.debug('profilic::apiRouter::signupHandler CATCH block');
    w.debug(err);
    res.status(500).json({ profileList: [], insertedCount: 0, message: 'An error occurred' });
  }
}

function authHandler(req, res, next) {
  //we only get here if all is well.
  w.debug('profilic::apiRouter::authHandler POST|auth OK');
  res.status(200).json({ validsession: true, message: 'Auth OK' });
}

function updateMultiple(req, res, next) {
  w.debug('profilic::apiRouter::updateMultiple');
  const UserProfileDAO = req.app.locals.UserProfileDAO;

  //this is a strange line; may rethink this. Essentially if the client calls the api directly,
  //it is req.body that is populated. In some cases there is preparatory work before updates, and 
  //some middleware might provide the final list for updates.
  let profileObjList = req.middlewareFinalizedList || req.body;
  let updatePromises;

  try {
    if (!Array.isArray(profileObjList)) {
      res.status(500).json({ profileList: [], message: 'Input list not provided' });
      return;
    }
    if(req.microUpdate){//using if-else cos having problems with deeply nested 'this' context playing well with map.
      updatePromises = profileObjList.map((profileObj) => {
        return UserProfileDAO.updateProfileWithMicroResponseAsync(profileObj); //the promise
      });
    } else {
      updatePromises = profileObjList.map((profileObj) => {
        return UserProfileDAO.updateProfileAsync(profileObj); //the promise
      });
    }
  } catch (err) {
    w.debug('profilic::apiRouter::updateMultiple CATCH block');
    w.debug(err);
    res.status(500).json({ profileList: [], message: 'An error occurred' });
  }

  Promise.all(updatePromises).then((results) => {
    res.json({ profileList: results, message: 'OK' });
  }).catch((err) => {
    w.debug('profilic::apiRouter::updateMultiple Promise.all CATCH block');
    w.debug(err);
    res.status(500).json({ profileList: [], message: 'An error occurred' });
  });
}

function createLinkage(req, res, next) {
  w.debug('profilic::apiRouter::createLinkage');

  let fromProfileObj = req.body.linkfrom;
  let toProfileObj = req.body.linkto;

  try {
    //TODO: future 'join' table. For now, supporting demo app(s with super flat data structures.
    let updateList = [];
    let followingList = fromProfileObj.following || [];
    let followedUser = toProfileObj.username;

    followingList.push(followedUser);
    let fromObj = Object.assign(fromProfileObj);
    fromObj.following = followingList;
    updateList.push(fromObj);


    let followersList = toProfileObj.followers || [];
    let followingUser = fromProfileObj.username;

    followersList.push(followingUser);
    let toObj = Object.assign(toProfileObj);
    toObj.followers = followersList;
    updateList.push(toObj);


    //unless the follow relationships are net new, there might not be anything to update, hence length check below
    if (updateList.length > 0) {
      //hand over to updateMultiple
      req.middlewareFinalizedList = updateList;
      req.microUpdate = true;
      next();
      return;
    } else {
      //nothing to do
      res.json({ profileList: [fromProfileObj, toProfileObj], message: 'OK' });
    }

  } catch (err) {
    w.debug('profilic::apiRouter::createLinkage - an error occured');
    w.debug(err);
    return next(err);
  }
}

function deleteLinkage(req, res, next) {
  w.debug('profilic::apiRouter::deleteLinkage');

  let fromProfileObj = req.body.linkfrom;
  let toProfileObj = req.body.linkto;

  try {
    //TODO: future 'join' table. For now, supporting demo apps with super flat data structures.
    let updateList = [];
    let followingList = fromProfileObj.following || [];
    let followedUser = toProfileObj.username;

    let idx1 = followingList.indexOf(followedUser);
    if(idx1 != -1) {
      followingList.splice(idx1,1);
      let fromObj = Object.assign(fromProfileObj);
      fromObj.following = followingList;
      updateList.push(fromObj);
    }


    let followersList = toProfileObj.followers || [];
    let followingUser = fromProfileObj.username;

    let idx2 = followersList.indexOf(followingUser);
    if(idx2 != -1){
      followersList.splice(idx2,1);
      let toObj = Object.assign(toProfileObj);
      toObj.followers = followersList;
      updateList.push(toObj);
    }

    if (updateList.length > 0) {
      //hand over to updateMultiple
      req.middlewareFinalizedList = updateList;
      req.microUpdate = true;
      next();
      return;
    } else {
      //nothing to do
      res.json({ profileList: [fromProfileObj, toProfileObj], message: 'OK' });
    }
  } catch (err) {
    w.debug('profilic::apiRouter::deleteLinkage - an error occured');
    w.debug(err);
    return next(err);
  }
}

module.exports = router;