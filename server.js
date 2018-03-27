'use strict';

var debug = true;
var devices = [];

var logging = function(toLog){
  if(debug){
    console.log(toLog);
  }
}

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'public/index.html');

const server = express()
    .use(express.static( 'public'))
    .use((req, res) => res.sendFile(INDEX) )
    .listen(PORT, () => logging(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

wss.on('connection', (ws) => {
  logging('Client connected');

  ws.on('message', function incoming(message) {
    var obj = JSON.parse( message );

    if (!devices.find(x => x.name == obj.name)){
      devices.push({"name":obj.name,"device":obj.device});
    }
    ws.name = obj.name;
    ws.device = obj.device;

    logging(message);
  
    var foundDirect = false;
    var directDevice = {};
    if (typeof obj.to != "undefined" ){
      if(wss.clients.find(x => x.name == obj.to)){
        directDevice = wss.clients.find(x => x.name == obj.to);
        foundDirect = true;
      }
    }
    if(foundDirect){
      directDevice.send(message);
      logging('-----> to '+directDevice.device+' "'+directDevice.name + '" directly');
    }
    else{
      wss.clients.forEach((client) => {
        if (client.device == 'lamp' && obj.device == 'control'){
          client.send(message);
          logging('-----> to lamps "'+ client.name+'"');
        }
        if (client.device == 'control' && obj.device == 'lamp'){
          client.send(message);
          logging('-----> to controls "'+ client.name+'"');
        }
      });
    }
  });

  ws.on('close', (ws) => {
    logging('Client disconnected');
    
    var controls = wss.clients.filter((dev) => dev.device == "control");
    var disconnectedDevice = {};
    
    try {
      devices.forEach((device) => {
        if (!wss.clients.find(client => client.name == device.name)){
          disconnectedDevice = device;
          throw {}; // just for exit the forEach
        }
      });
    } catch (e) {
    }

    if(Object.keys(disconnectedDevice).length){
      controls.forEach((control) => {
        var messageJson = {
          "device":disconnectedDevice.device,
          "action":"disconnected",
          "name":disconnectedDevice.name,
          "to":control.name
        };

        var message = JSON.stringify(messageJson);
        logging(message);
        logging('-----> to control "'+control.name+'" from server');
        control.send(message);
      });
    }
    else{
      logging("-----! Couldn't find the device details :(");
    }
  });

});

//setInterval(() => {
 //  wss.clients.forEach((client) => {
 //    client.send(new Date().toTimeString());
 //  });
 //}, 1000);

