#!/usr/bin/env node
console.log('>>>>>>>> starting mongodb >>>>>> ');

//can't seem to see stdout with .exec, so using .spawn instead, which uses streams and event emitters
const spawn = require('child_process').spawn;

//consder mongod --fork --logpath /path/to/logfile.log in future iterations || winston
var mongod = spawn('C:/Program Files/MongoDB/Server/3.4/bin/mongod.exe', ['--dbpath', 'C:/_data/db']);

mongod.stdout.on('data', function(data) {
  console.log('mongod | stdout : ' + data.toString());
});

mongod.stderr.on('data', function(data) {
  console.log('mongod | stderr : ' + data.toString());
});

mongod.on('exit', function(exitcode) {
  console.log('mongod process exited with code [' + exitcode.toString() + ']');
});
