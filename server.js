
'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'public/index.html');

const server = express()
    .use(express.static( 'public'))
    .use((req, res) => res.sendFile(INDEX) )
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', function incoming(message) {
    var obj = JSON.parse( message );

    ws.name = obj.name;
    ws.device = obj.device;

    console.log(message);
    wss.clients.forEach((client) => {
      if (typeof obj.for != "undefined"  && client.name == obj.for){
        console.log('specific message for name '+client.name);
        client.send(message);
      }
      else{
        if (client.device == 'lamp' && obj.device == 'control'){
          console.log('message for lamp '+ client.name);
          client.send(message);
        }
        if (client.device == 'control' && obj.device == 'lamp'){
          console.log('message for control '+ client.name);
          client.send(message);
        }
      }
    });
  });

  ws.on('close', (ws) => {
    console.log('Client disconnected');
    var lamps = wss.clients.filter((dev) => dev.device == "lamp");
    var controls = wss.clients.filter((dev) => dev.device == "control");
    controls.forEach((control) => {
      var lampNames = [];
      lamps.forEach((lamp) => {
        lampNames.push(lamp.name);
      })

      var messageJson = {
        "device":"control",
        "action":"lamp-list",
        "name":"server",
        "to":control.name,
        "lamps":lampNames
      };

      var message = JSON.stringify(messageJson);
      console.log(message);
      console.log('message for control '+control.name+' from server');
      control.send(message);
    });
  });

});

//setInterval(() => {
 //  wss.clients.forEach((client) => {
 //    client.send(new Date().toTimeString());
 //  });
 //}, 1000);

