#!/usr/bin/env node
const w = require('../src/utils/logger');
w.info('>>>>>>>> starting mongodb >>>>>> ');

//can't seem to see stdout with .exec, so using .spawn instead, which uses streams and event emitters
const spawn = require('child_process').spawn;

//consder mongod --fork --logpath /path/to/logfile.log in future iterations || winston
var mongod = spawn('C:/Program Files/MongoDB/Server/3.4/bin/mongod.exe', ['--dbpath', 'C:/_data/db']);

mongod.stdout.on('data', function(data) {
  w.info('mongod | stdout : ' + data.toString());
});

mongod.stderr.on('data', function(data) {
  w.info('mongod | stderr : ' + data.toString());
});

mongod.on('exit', function(exitcode) {
  w.info('mongod process exited with code [' + exitcode.toString() + ']');
});
