
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
    ws.device = obj.device;
    console.log(message);

    wss.clients.forEach((client) => {
      if (client.device == 'lamp' && obj.device == 'control'){
          console.log('message for lamp');
          client.send(message);
      }
      if (client.device == 'control' && obj.device == 'lamp'){
          console.log('message for control');
          client.send(message);
      }
    });


      //console.log(ws);

    //wss.clients.forEach((client) => {
    //console.log(client);
    //client.send(message);
    //});
  });

  ws.on('close', () => console.log('Client disconnected'));

  //ws.send('>Connected');
  //ws.send('<Connected');
});

//setInterval(() => {
 //  wss.clients.forEach((client) => {
 //    client.send(new Date().toTimeString());
 //  });
 //}, 1000);

