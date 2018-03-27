'use strict';

var connection = null;
var debug = true;
var formNotify,statusNotify;
var settings = {};

var showSettings = function() {
    var domItem;
    for (var key in settings) {
        if (settings.hasOwnProperty(key)) {
            domItem = document.getElementById(key);
            if(typeof domItem != "undefined" && domItem != null){
                domItem.innerHTML = settings[key];
            }
        }
    }
    colorFromRGB("color-container");
    colorFromRGB("coloralt-container");
}

var colorFromRGB = function(id){

    var color = document.getElementById(id);
    var r = color.getElementsByClassName('color_r')[0].innerHTML;
    var g = color.getElementsByClassName('color_g')[0].innerHTML;
    var b = color.getElementsByClassName('color_b')[0].innerHTML;
    
    color.getElementsByClassName('color')[0].style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
}

var readTextFile = function(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

var logging = function(message) {
    if(debug){console.log(message);}
}

var initialize = function(){

    readTextFile("config.json", function(text){
        settings = JSON.parse(text);
        showSettings();
        initializePost();
    });

};

var initializePost = function(){

    statusNotify = document.getElementById("statusChecker");

    try{
        var HOST = location.origin.replace(/^http/, 'ws');
        connection = new WebSocket(HOST, ['arduino']);

        connection.onerror = function (error) {
            logging('WebSocket Error '+ error);
            statusNotify.style.background = 'red';
            statusNotify.innerHTML =  "WebSocket Error!" ;
            logging("WebSocket Error!" );
        };
        connection.onclose = function(e) {
            logging('Server: '+ e.data);
            statusNotify.style.background = 'red';
            statusNotify.innerHTML =  "WebSocket Disconnected!" ;
            logging("WebSocket Disconnected!" );
        };
        connection.onopen = function () {
            statusNotify.style.background = 'orange';
            statusNotify.innerHTML =  "Connection ready!" ;

            logging("Connection ready!" );

            var responseJson={"device":"lamp","action":"connected","name":settings['name'],"to":"all"};
            var message =  JSON.stringify(responseJson);
            connection.send(message);
        };
        connection.onmessage = function (e) {
            if(typeof e.data != "undefined"){
                var json = JSON.parse(e.data);
                if(typeof json.device != "undefined" && json.device == "control" && typeof json.action != "undefined"){
                    logging(json.action);
                    var responseJson = {};
                    var message = '';
                    switch(json.action)
                    {
                        case "connected":
                            statusNotify.style.background = 'yellow';
                            statusNotify.innerHTML =  "Lamp online!" ;
                
                            logging("Control is connected!" );
            
                            responseJson={"device":"lamp","action":"connected","name":settings['name']};
                            message =  JSON.stringify(responseJson);
                            connection.send(message);
                            logging('Control connected, sent lamp connected message');
                            logging(responseJson);
                            break;
                        case "read-all":
                            statusNotify.style.background = 'green';
                            statusNotify.innerHTML =  "Lamp online!" ;
                
                            responseJson={"device":"lamp","action":"read-all","name":settings['name']};
                            message =  JSON.stringify(responseJson);
                            connection.send(message);
                            logging('Control request conf, sent lamp confs message');
                            logging(responseJson);
                            break;
                        case "save-single":
                            if(typeof json.conf != "undefined" && typeof json.value != "undefined")
                            { 
                                settings[json.conf] = json.value;
                                showSettings();
                                logging('Control send single conf');
                            }
                            else
                            {
                                logging('Control send single conf, but single conf is not defined');
                            }
                            break;
                        case "save-all":
                            settings = json;
                            showSettings();
                            logging('Control send all confs');
                            break;
                        case "reset":
                            logging('Control send reset request');
                            break;
                        case "restart":
                            logging('Control send restart request');
                            break;
                        default:
                            logging(responseJson.action);
                            logging("don't understand action");
                            break;
                    }
                }
            }
        };
    }catch(err){
        statusNotify.style.background = 'red';
        statusNotify.innerHTML =  "WebSocket Disconnected!" ;
        logging("WebSocket Disconnected!" );
        logging(err);
    }
}

initialize();
