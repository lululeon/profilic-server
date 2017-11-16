#!/usr/bin/env node
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const w = require('../src/utils/logger'); //winston logger config

function main() {
  // info about the commandline for this server.
  // command-line-arg entries must have name at minimum
  const optionList = [
    {
      name: 'help',
      type: Boolean,
      description: 'Print this usage guide. There are no commandline options at this time.'
    },
    {
      name: 'serverport',
      type: Number,
      description: 'Provide a port number for profilic server.'
    }
  ];

  // command-line-usage entries must be {name, header,content|optionList}
  const optionDefinitions = [
    {
      name: 'Profilic Server',
      header: 'Profilic Server',
      content: 'A schema-less, turnkey [italic]{user-profiles-as-a-service} server for quick prototyping.'
    },
    {
      name: 'Options',
      header: 'Options',
      optionList: optionList
    }
  ];
  
  const usage = commandLineUsage(optionDefinitions);
  const options = commandLineArgs(optionDefinitions[1].optionList);

  if (options.help) {
    w.info(usage);
    return;
  } else {
    //set commandline overrides
    if(options.serverport) {
      w.info('found :', options.serverport);
      process.env.PRF_PORT = options.serverport;
    }

    //late require to pickup any mods to env:
    const profilicServer = require('../src/'); //automatically implies index.js in that folder
    profilicServer.runServer();
  }
}

main();