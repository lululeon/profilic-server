#!/usr/bin/env node
console.log('<<<<<<<<<< stopping mongodb <<<<<<<<<<< ');

//can't seem to see stdout with .exec, so using .spawn instead, which uses streams and event emitters
const spawn = require('child_process').spawn;

//alternative: pass these as js file (or eval script) to the mongo utility instead:
// use admin
// db.shutdownServer()
var mongoshell = spawn('C:/Program Files/MongoDB/Server/3.4/bin/mongo.exe', ['src/server/bin/stopper.js']);

mongoshell.stdout.on('data', function(data) {
  console.log('mongoshell | stdout : ' + data.toString());
});

mongoshell.stderr.on('data', function(data) {
  console.log('mongoshell | stderr : ' + data.toString());
});

mongoshell.on('exit', function(exitcode) {
  console.log('mongoshell process exited with code [' + exitcode.toString() + ']');
});