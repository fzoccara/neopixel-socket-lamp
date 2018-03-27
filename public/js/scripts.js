'use strict';

var connection = null;
var debug = true;
var formNotify,statusNotify;
var settings = [];
var initialized = false;
var mainColor = null;
var secondaryColor = null;

var logging = function(toLog){
    if(debug){console.log(toLog);}
}

var unsetVariables = function(json){
    if(typeof json.name != "undefined" && typeof settings[json.name] != "undefined"){
        unset(settings[json.name]);
    }
}

var initVariables = function(json){
    name = json.name;

    settings[name] = {};
    settings[name].SSID = (typeof json.SSID != "undefined") ? json.SSID : "";
    settings[name].PASSWORD = (typeof json.PASSWORD != "undefined") ? json.PASSWORD: "";
    settings[name].MODE = (typeof json.MODE != "undefined") ? json.MODE: "";
    settings[name].STATIC_IP = (typeof json.STATIC_IP != "undefined") ? json.STATIC_IP: "";

    settings[name].SSIDAP = (typeof json.SSIDAP != "undefined") ? json.SSIDAP: "fzoccara-lamp";
    settings[name].PASSWORDAP = (typeof json.PASSWORDAP != "undefined") ? json.PASSWORDAP: "12345678";

    settings[name].LAMP = (typeof json.LAMP != "undefined") ? json.LAMP: "";
    settings[name].COLOR_R = (typeof json.COLOR_R != "undefined") ? json.COLOR_R: "";
    settings[name].COLOR_G = (typeof json.COLOR_G != "undefined") ? json.COLOR_G: "";
    settings[name].COLOR_B = (typeof json.COLOR_B != "undefined") ? json.COLOR_B: "";
    settings[name].COLOR_ALT_R = (typeof json.COLOR_ALT_R != "undefined") ? json.COLOR_ALT_R: "";
    settings[name].COLOR_ALT_G = (typeof json.COLOR_ALT_G != "undefined") ? json.COLOR_ALT_G: "";
    settings[name].COLOR_ALT_B = (typeof json.COLOR_ALT_B != "undefined") ? json.COLOR_ALT_B: "";
    settings[name].INTERVAL = (typeof json.INTERVAL != "undefined") ? json.INTERVAL: "";
    settings[name].STEPS = (typeof json.STEPS != "undefined") ? json.STEPS: "";

    settings[name].SSL = (typeof json.SSL != "undefined") ? json.SSL: "0";
    settings[name].HOST = (typeof json.HOST != "undefined") ? json.HOST: "";
    settings[name].PORT = (typeof json.PORT != "undefined") ? json.PORT: "";
    settings[name].PATH = (typeof json.PATH != "undefined") ? json.PATH: "";
    settings[name].FINGERPRINT = (typeof json.FINGERPRINT != "undefined") ? json.FINGERPRINT: "";

    setFormFields();
    initializeForm();
}

var setFormFields = function(){
    document.getElementById("ssid").value = settings[name].SSID;
    document.getElementById("password").value = settings[name].PASSWORD;
    document.getElementById("staticip").value = settings[name].STATIC_IP;

    document.getElementById("ssidap").value = settings[name].SSIDAP;
    document.getElementById("passwordap").value = settings[name].PASSWORDAP;

    if(document.getElementById("lamp" + settings[name].LAMP)){
        document.getElementById("lamp" + settings[name].LAMP).checked = true;;
    }
    else{
        document.getElementById("lamp1").checked = true;;
    }
    setLampModeDependencies();

    document.getElementById("color_r").value = settings[name].COLOR_R;
    document.getElementById("color_g").value = settings[name].COLOR_G;
    document.getElementById("color_b").value = settings[name].COLOR_B;
    if(typeof mainColor != "undefined" && mainColor && typeof mainColor.color != "undefined"){
        mainColor.color.rgb = { r: settings[name].COLOR_R, g: settings[name].COLOR_G, b: settings[name].COLOR_B };
    }

    document.getElementById("color_alt_r").value = settings[name].COLOR_ALT_R;
    document.getElementById("color_alt_g").value = settings[name].COLOR_ALT_G;
    document.getElementById("color_alt_b").value = settings[name].COLOR_ALT_B;
    if(typeof secondaryColor != "undefined" && secondaryColor && typeof secondaryColor.color != "undefined"){
        secondaryColor.color.rgb = { r: settings[name].COLOR_ALT_R, g: settings[name].COLOR_ALT_G, b: settings[name].COLOR_ALT_B };
    }

    document.getElementById("interval").value = settings[name].INTERVAL;
    document.getElementById("steps").value = settings[name].STEPS;

    document.getElementById("ssl").checked = (settings[name].SSL == "0") ? false : "checked";
    document.getElementById("host").value = settings[name].HOST;
    document.getElementById("port").value = settings[name].PORT;
    document.getElementById("path").value = settings[name].PATH;
    document.getElementById("fingerprint").value = settings[name].FINGERPRINT;

    onSslToggle(document.getElementById("ssl"));
}

var onSslToggle = function(elem){

    if(elem.checked == 1){
        document.getElementById("ssl-configuration").style.display = "block";
    }
    else{
        document.getElementById("ssl-configuration").style.display = "none";
    }
}

var setVariables = function(){

    settings[name].SSID = document.getElementById("ssid").value;
    settings[name].PASSWORD = document.getElementById("password").value;
    settings[name].STATIC_IP = document.getElementById("staticip").value;

    settings[name].SSIDAP = document.getElementById("ssidap").value;
    settings[name].PASSWORDAP = document.getElementById("passwordap").value;

    settings[name].LAMP = 8;
    var radios = document.getElementsByName('lamp');
    for (var i = 0, length = radios.length; i < length; i++)
    {
        if (radios[i].checked){
            settings[name].LAMP = radios[i].value;
            break;
        }
    }
    setLampModeDependencies();

    settings[name].COLOR_R = document.getElementById("color_r").value;
    settings[name].COLOR_G = document.getElementById("color_g").value;
    settings[name].COLOR_B = document.getElementById("color_b").value;
    settings[name].COLOR_ALT_R = document.getElementById("color_alt_r").value;
    settings[name].COLOR_ALT_G = document.getElementById("color_alt_g").value;
    settings[name].COLOR_ALT_B = document.getElementById("color_alt_b").value;

    settings[name].SSL = (document.getElementById("ssl").checked)? '1' : '0';
    settings[name].HOST = document.getElementById("host").value;
    settings[name].PORT = document.getElementById("port").value;
    settings[name].PATH = document.getElementById("path").value;
    settings[name].FINGERPRINT = document.getElementById("fingerprint").value;

}

var setLampModeDependencies = function(){

    var mainColorContainer = document.getElementById("main-color-container");
    var secondaryColorContainer = document.getElementById("secondary-color-container");
    var intervalContainer = document.getElementById("interval-container");
    var stepsContainer = document.getElementById("steps-container");

    switch(settings[name].LAMP){
        case "1": // rainbow mode
        case "8": // color rotation mode
            mainColorContainer.style.display = "none";
            secondaryColorContainer.style.display = "none";
            stepsContainer.style.display = "none";
            intervalContainer.style.display = "block";
            break;
        case "2": // double fase
            mainColorContainer.style.display = "block";
            secondaryColorContainer.style.display = "block";
            stepsContainer.style.display = "none";
            intervalContainer.style.display = "block";
            break;
        case "5": // fade
            mainColorContainer.style.display = "block";
            secondaryColorContainer.style.display = "block";
            stepsContainer.style.display = "block";
            intervalContainer.style.display = "block";
            break;
        case "3": // color wipe (fullfill)
            mainColorContainer.style.display = "block";
            secondaryColorContainer.style.display = "none";
            stepsContainer.style.display = "none";
            intervalContainer.style.display = "none";
            break;
        case "4": // scanner
        case "9": // infinite loop
            mainColorContainer.style.display = "block";
            secondaryColorContainer.style.display = "none";
            stepsContainer.style.display = "none";
            intervalContainer.style.display = "block";
            break;
        case "6": // static color
            mainColorContainer.style.display = "block";
            secondaryColorContainer.style.display = "none";
            stepsContainer.style.display = "none";
            intervalContainer.style.display = "none";
            break;
        case "7": // OFF MODE
            mainColorContainer.style.display = "none";
            secondaryColorContainer.style.display = "none";
            stepsContainer.style.display = "none";
            intervalContainer.style.display = "none";
            break;
        default:
            mainColorContainer.style.display = "none";
            secondaryColorContainer.style.display = "none";
            stepsContainer.style.display = "none";
            intervalContainer.style.display = "none";
    }

}

var addLamp = function(lampName){
    var lamps = document.getElementById("lamps-container");
    lamps.innerHTML = lamps.innerHTML + ' <span id="'+lampName+'" class="lampConnected">' + lampName + '</span>';
};
var removeLamp = function(lampName){
    var lamps = document.getElementById("lamps-container");
    var lamp = document.getElementById(lampName);
    lamps.removeChild(lamp);
    
    if(document.getElementsByClassName('#lamps-container .lampConnected').length == 0){
        document.getElementById("submit").classList.add("disabled");
        document.getElementById("reset").classList.add("disabled");
        document.getElementById("restart").classList.add("disabled");
    }
};

var initializeForm = function(){
    if(!initialized)
    {
        initialized = true;
        mainColor = new iro.ColorPicker("#main-color", {
            width: 320,
            height: 320,
            color: {r: settings[name].COLOR_R, g: settings[name].COLOR_G, b: settings[name].COLOR_B},
        });
        secondaryColor = new iro.ColorPicker("#secondary-color", {
            width: 320,
            height: 320,
            color: {r: settings[name].COLOR_ALT_R, g: settings[name].COLOR_ALT_G, b: settings[name].COLOR_ALT_B},
        });
        mainColor.on("input:end", function onInputStart() {
            document.getElementById("color_r").value = mainColor.color.rgb.r;
            sendSingleCONF("COLOR_R",mainColor.color.rgb.r);
            document.getElementById("color_g").value = mainColor.color.rgb.g;
            sendSingleCONF("COLOR_G",mainColor.color.rgb.g);
            document.getElementById("color_b").value = mainColor.color.rgb.b;
            sendSingleCONF("COLOR_B",mainColor.color.rgb.b);
        });
        secondaryColor.on("input:end", function onInputStart() {
            document.getElementById("color_alt_r").value = secondaryColor.color.rgb.r;
            sendSingleCONF("COLOR_ALT_R",secondaryColor.color.rgb.r);
            document.getElementById("color_alt_g").value = secondaryColor.color.rgb.g;
            sendSingleCONF("COLOR_ALT_G",secondaryColor.color.rgb.g);
            document.getElementById("color_alt_b").value = secondaryColor.color.rgb.b;
            sendSingleCONF("COLOR_ALT_B",secondaryColor.color.rgb.b);
        });

        let inputIntervalElement = document.getElementById('interval');
        let outputIntervalElement = document.getElementById('interval_output');
        let intervalRange = new Range(inputIntervalElement, outputIntervalElement, () => {});
        intervalRange.setValue(settings[name].INTERVAL);
        intervalRange.onValueChange(() => {
            document.getElementById("interval").value = intervalRange.getValue();
            settings[name].INTERVAL = intervalRange.getValue();
            sendSingleCONF("INTERVAL",intervalRange.getValue())
        });

        let inputStepsElement = document.getElementById('steps');
        let outputStepsElement = document.getElementById('steps_output');
        let stepsRange = new Range(inputStepsElement, outputStepsElement, () => {});
        stepsRange.setValue(settings[name].STEPS);
        stepsRange.onValueChange(() => {
            document.getElementById("steps").value = stepsRange.getValue();
            settings[name].STEPS = stepsRange.getValue();
            sendSingleCONF("STEPS",stepsRange.getValue())
        });

        window.onresize = function(event) {
        };
    }
}

var toggleVisibility = function(link, idSelector){
    var container = document.getElementById(idSelector);
    if(container.style.display === 'block'){
        container.style.display = "none";
        link.innerHTML = container.getAttribute("data-show-label");
    }
    else{
        container.style.display = "block";
        link.innerHTML = container.getAttribute("data-hide-label");
    }
}

var sendSingleCONF = function( conf , value ){
    setVariables();

    formNotify = document.getElementById("formChecker");

    var j={"device":"control","action":"save-single","conf":conf,"value":value,"name":getControlName(),"to":"all"};

    var configurations =  JSON.stringify(j);

    logging( 'conf: ' + configurations );

    try{
        connection.send(configurations );
        formNotify.style.background = 'green';
        formNotify.innerHTML =  "Single configuration sent!" ;
        logging("Single configuration sent!" );
    }catch(err){
        formNotify.style.background = 'orange';
        formNotify.innerHTML =  "Single configuration not sent!" ;
        logging(err);
    }
    return;

}

function extend(){
    for(var i=1; i<arguments.length; i++)
        for(var key in arguments[i])
            if(arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
    return arguments[0];
}

var sendAllCONF = function( ){
    setVariables();
    formNotify = document.getElementById("formChecker");

    var j = extend({"device":"control","action":"save-all","name":getControlName(),"to":"all"}, settings);

    var configurations =  JSON.stringify(j);
    logging( 'conf: ' + configurations ); 

    try{
        connection.send(configurations );
        formNotify.style.background = 'green';
        formNotify.innerHTML =  "All configuration sent!" ;
        logging("All configuration sent!" );
    }catch(err){
        formNotify.style.background = 'orange';
        formNotify.innerHTML =  "All configuration not sent!" ;
        logging(err);
    }
    return;
}

var implode = function( array, separator ){
    return Object.keys(array).map(function(x){return array[x];}).join(separator)
}

var resetLamp = function(){

    var j={"device":"control","action":"reset","name":getControlName(),"to":"all"};

    var configurations =  JSON.stringify(j);

    connection.send(configurations);
    document.getElementById("submit").classList.add("disabled");
    location.reload();
}

var restartLamp = function(){

    var j={"device":"control","action":"restart","name":getControlName(),"to":"all"};

    var configurations =  JSON.stringify(j);

    connection.send(configurations);
    document.getElementById("submit").classList.add("disabled");
    location.reload();
}

var getControlName = function(){
    /*$.getJSON('//freegeoip.net/json/?callback=?', function(data) {
        logging(JSON.stringify(data, null, 2));
    });*/
    return "web-control";
}

var initialize = function(){

    statusNotify = document.getElementById("statusChecker");

    try{

        //connection = new WebSocket('ws://'+location.hostname+':81/', ['arduino']);
        //connection = new WebSocket('ws://172.17.0.2:8080', ['arduino']);
        //connection = new WebSocket('ws://192.168.4.1:81/', ['arduino']);
        //connection = new WebSocket('wss://fzoccara.herokuapp.com/', ['arduino']);
        var HOST = location.origin.replace(/^http/, 'ws')
        //HOST = "wss://fzoccara.herokuapp.com/";
        connection = new WebSocket(HOST, ['arduino']);

        connection.onopen = function () {
            statusNotify.style.background = 'orange';
            statusNotify.innerHTML =  "Connection ready!" ;

            logging("Connection ready!" );
            var j={"device":"control","action":"connected","name":getControlName(),"to":"all"};
            var configurations =  JSON.stringify(j);
            connection.send(configurations);
        };
        connection.onerror = function (error) {
            logging('WebSocket Error ', error);
        };
        connection.onmessage = function (e) {

            logging('WebSocket message received ');
            if(typeof e.data != "undefined"){
                var json = JSON.parse(e.data);
                logging(json);
                var message = '';
                var responseJson = {};
                if(typeof json.device != "undefined" && typeof json.action != "undefined"){
                    if(json.device == "lamp"){
                        if(json.action == "connected"){
                            logging(json.name+ " lamp connected!" );

                            var responseJson={"device":"control","action":"read-all","name":getControlName(),"to":json.name};
                            message =  JSON.stringify(responseJson);
                            connection.send(message);
                            
                            addLamp(json.name);

                            document.getElementById("submit").classList.remove("disabled");
                            document.getElementById("reset").classList.remove("disabled");
                            document.getElementById("restart").classList.remove("disabled");
                        }
                        if(json.action == "read-all"){
                            initVariables(json);
                            logging("Get configurations!" );
                        }
                        if(json.action == "disconnected"){
                            removeLamp(json.name);
                            unsetVariables(json);
                            logging(json.name+" lamp disconnected!" );
                        }
                    }
                }
            }
        };
        connection.onclose = function(e) {
            logging('Server: ', e.data);
            statusNotify.style.background = 'red';
            statusNotify.innerHTML =  "WebSocket Disconnected!" ;
            logging("WebSocket Disconnected!" );
        };
    }catch(err){
        statusNotify.style.background = 'red';
        statusNotify.innerHTML =  "WebSocket Disconnected!" ;
        logging("WebSocket Disconnected!" );
        logging(err);
    }
}

initialize();
