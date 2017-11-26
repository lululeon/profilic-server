//data access object for UserProfile entity
//lets require/import the mongodb native drivers.
//const Promise = require('bluebird');
const mongodb = require('mongodb'); //Promise.promisifyAll(require('mongodb'));
const w = require('../utils/logger');

class UserProfileDAO {

  constructor(dbconn) {
    w.debug('UserProfileDAO::UserProfileDAO - initialized with conn to db [', dbconn.databaseName, ']');
    this.db = dbconn;
    this.profilesCollectionName = process.env.PRF_DB_COLLECTION_PROFILES;
  }

  //TODO: in future you'd limit this somehow - eg top 50 or so, etc.
  //** GET ALL */
  getAllProfiles(callback) {
    w.info('UserProfileDAO::getAllProfiles');
    let col = this.db.collection(this.profilesCollectionName);
    col.find({}, { password: 0 }).toArray()
      .then(function (docs) {
        w.debug('UserProfileDAO::getAllProfiles found [' + docs.length + '] items. returning...');
        callback(null, docs);
      })
      .catch(function (err) {
        w.warn(err);
        throw (err);
      });
  }

  //** RAW CREATE - for CRUD tests in development env only */
  createProfile(profileObj, callback) {
    if (process.env.PRF_NODE_ENV === 'development') {
      w.info('UserProfileDAO::createProfile');
      let col = this.db.collection(this.profilesCollectionName);

      col.insertOne(profileObj)
        .then(function (response) {
          if (response.insertedCount !== 1) throw new Error('Insert ONE inserted [' + response.insertedCount + '] docs!');
          w.debug('UserProfileDAO::createProfile : [' + response.insertedCount + '] items added with new id[' + response.insertedId + ']');
          callback(null, response);
        })
        .catch(function (err) {
          w.warn(err);
          throw (err);
        });
    } else {
      //fail silently
      callback(null);
    }
  }

  //** UPDATE Async */
  updateProfileAsync(profileObj) {//promisified version to support follow relationships implementaion
    w.info('UserProfileDAO::updateProfileAsync');
    return new Promise((resolve, reject) => {
      this.updateProfile(profileObj, function (err, response) {
        if (err) {
          w.warn(err);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  //** UPDATE */
  updateProfile(profileObj, callback) {
    w.info('UserProfileDAO::updateProfile');
    let col = this.db.collection(this.profilesCollectionName);

    //sanity checks + sanitize
    if (!profileObj.hasOwnProperty('_id')) throw new Error('Profile unique id missing.');
    const target_id = profileObj._id;
    let _id = new mongodb.ObjectID(target_id);
    delete profileObj._id;
    delete profileObj.password;

    let scope = this;
    col.updateOne({ _id: _id }, { $set: profileObj })
      .then(function (response) {
        if (response.modifiedCount !== 1) {
          w.warn('Update ONE updated [' + response.modifiedCount + '] docs! No need to update unchanged document?');
        }
        //send back the updated object
        scope.findById(target_id, callback);
      })
      .catch(function (err) {
        w.warn(err);
        throw (err);
      });
  }

  //** UPDATE Micro Async */
  updateProfileWithMicroResponseAsync(profileObj) {//promisified version to support follow relationships implementaion
    w.info('UserProfileDAO::updateProfileWithMicroResponseAsync');
    return new Promise((resolve, reject) => {
      this.updateProfileWithMicroResponse(profileObj, function (err, response) {
        if (err) {
          w.warn(err);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  //** UPDATE - micro : response payload consists of only the updated fields*/
  updateProfileWithMicroResponse(profileObj, callback) {
    w.info('UserProfileDAO::updateProfileWithMicroResponse');
    let col = this.db.collection(this.profilesCollectionName);

    //sanity checks + sanitize
    if (!profileObj.hasOwnProperty('_id')) throw new Error('Profile unique id missing.');
    const target_id = profileObj._id;
    let _id = new mongodb.ObjectID(target_id);
    delete profileObj._id;
    delete profileObj.password;
    let fetchedAttributes = {};
    Object.keys(profileObj).forEach( function(k){
      fetchedAttributes[k] = 1;
    })

    col.updateOne({ _id: _id }, { $set: profileObj })
      .then(function (response) {
        if (response.modifiedCount !== 1) {
          w.warn('Update ONE updated [' + response.modifiedCount + '] docs! No need to update unchanged document?');
        }
        //send back the updated data elements only          
        col.findOne({ _id: _id }, { fields: fetchedAttributes })
        .then(function (response) {
          if (response) callback(null, response);
          else callback(new Error('Cannot find user'));
        })
        .catch(function (err) {
          throw (err);
        });
      })
      .catch(function (err) {
        w.warn(err);
        throw (err);
      });
  }

  //** DELETE */
  deleteProfile(id, callback) {
    w.info('UserProfileDAO::deleteProfile');
    let col = this.db.collection(this.profilesCollectionName);
    col.deleteOne({ _id: new mongodb.ObjectID(id) })
      .then(function (response) {
        if (response.deletedCount !== 1) throw new Error('delete ONE deleted [' + response.deletedCount + '] docs!');
        w.debug('UserProfileDAO::deleteProfile : [' + response.deletedCount + '] items deleted...');
        callback(null, response);
      })
      .catch(function (err) {
        w.warn(err);
        throw (err);
      });
  }

  //** SIGNUP */
  signup(profileObj, callback) {
    w.info('UserProfileDAO::signup');
    let col = this.db.collection(this.profilesCollectionName);
    col.insertOne(profileObj)
      .then(function (response) {
        if (response.insertedCount !== 1) throw new Error('Insert ONE inserted [' + response.insertedCount + '] docs!');
        w.debug('UserProfileDAO::signup : [' + response.insertedCount + '] items added with new id[' + response.insertedId + ']');
        callback(null, response);
      })
      .catch(function (err) {
        w.warn(err);
        throw (err);
      });
  }

  //** FIND BY USERNAME */
  findByUsername(username, callback) {
    w.info('UserProfileDAO::findByUsername');
    let col = this.db.collection(this.profilesCollectionName);

    col.findOne({ username: username }, { fields: { password: 0 } }) //everyhing except password
      .then(function (response) {
        //w.debug('UserProfileDAO::findByUsername - found: ', response);
        if (response) callback(null, response);
        else callback(new Error('Cannot find user'));
      })
      .catch(function (err) {
        throw (err);
      });
  }

  //** FIND BY ID */
  findById(id, callback) {
    w.info('UserProfileDAO::findById');
    let col = this.db.collection(this.profilesCollectionName);

    col.findOne({ _id: new mongodb.ObjectID(id) }, { fields: { password: 0 } }) //everyhing except password
      .then(function (response) {
        //w.debug('UserProfileDAO::findById - found: ', response);
        if (response) callback(null, response);
        else callback(new Error('Cannot find user'));
      })
      .catch(function (err) {
        throw (err);
      });
  }

  //** FIND matching list of values in a given field - do not use with _id field */
  findIn(fieldname, valuelist, callback) {
    w.info('UserProfileDAO::findIn <fld>, <valuelist>');
    let col = this.db.collection(this.profilesCollectionName);
    let queryObj = {};
    let finalValues = valuelist;

    queryObj[fieldname] = { $in: finalValues };
    //w.debug(queryObj);

    col.find(queryObj, { fields: { password: 0 } }).toArray() //rtn all flds except password
      .then(function (response) {
        //w.debug('UserProfileDAO::findIn', response);
        if (response) callback(null, response);
        else callback(new Error('Cannot find users'));
      })
      .catch(function (err) {
        throw (err);
      });
  }


  // ################## THE FOLLOWING SHOULD NOT BE EXPOSED TO THE CLIENT AS THEY RETURN PASSWORD INFO
  //** AUTH BY USERNAME */
  authByUsername(profileObj, callback) {
    w.info('UserProfileDAO::authByUsername');
    let col = this.db.collection(this.profilesCollectionName);

    col.findOne({ username: profileObj.username }, { fields: { _id: 1, username: 1, email: 1, password: 1 } })
      .then(function (response) {
        //w.debug('UserProfileDAO::authByUsername - found: ', response);
        if (response) callback(null, response);
        else callback(new Error('Bad input'));
      })
      .catch(function (err) {
        throw (err);
      });
  }
};

module.exports = UserProfileDAO;
