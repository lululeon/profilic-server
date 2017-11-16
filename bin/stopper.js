//stopper.js
//you have to connect to the admin db for any of this to work.
var db = connect('127.0.0.1:27017/admin');
db.shutdownServer();