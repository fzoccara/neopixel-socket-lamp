'use strict';

var connection = null;
var debug = true;
var formNotify,statusNotify;
var settings = {};
var initialized = false;
var mainColor = null;
var secondaryColor = null;

var initVariables = function(json){
    
    settings.SSID = (typeof json.SSID != "undefined") ? json.SSID : "";
    settings.PASSWORD = (typeof json.PASSWORD != "undefined") ? json.PASSWORD: "";
    settings.MODE = (typeof json.MODE != "undefined") ? json.MODE: "";
    settings.STATIC_IP = (typeof json.STATIC_IP != "undefined") ? json.STATIC_IP: "";

    settings.SSIDAP = (typeof json.SSIDAP != "undefined") ? json.SSIDAP: "fzoccara-lamp";
    settings.PASSWORDAP = (typeof json.PASSWORDAP != "undefined") ? json.PASSWORDAP: "12345678";

    settings.LAMP = (typeof json.LAMP != "undefined") ? json.LAMP: "";
    settings.COLOR_R = (typeof json.COLOR_R != "undefined") ? json.COLOR_R: "";
    settings.COLOR_G = (typeof json.COLOR_G != "undefined") ? json.COLOR_G: "";
    settings.COLOR_B = (typeof json.COLOR_B != "undefined") ? json.COLOR_B: "";
    settings.COLOR_ALT_R = (typeof json.COLOR_ALT_R != "undefined") ? json.COLOR_ALT_R: "";
    settings.COLOR_ALT_G = (typeof json.COLOR_ALT_G != "undefined") ? json.COLOR_ALT_G: "";
    settings.COLOR_ALT_B = (typeof json.COLOR_ALT_B != "undefined") ? json.COLOR_ALT_B: "";
    settings.INTERVAL = (typeof json.INTERVAL != "undefined") ? json.INTERVAL: "";
    settings.STEPS = (typeof json.STEPS != "undefined") ? json.STEPS: "";

    settings.SSL = (typeof json.SSL != "undefined") ? json.SSL: "0";
    settings.HOST = (typeof json.HOST != "undefined") ? json.HOST: "";
    settings.PORT = (typeof json.PORT != "undefined") ? json.PORT: "";
    settings.PATH = (typeof json.PATH != "undefined") ? json.PATH: "";
    settings.FINGERPRINT = (typeof json.FINGERPRINT != "undefined") ? json.FINGERPRINT: "";

    setFormFields();
    initializeForm();
}

var setFormFields = function(){
    document.getElementById("ssid").value = settings.SSID;
    document.getElementById("password").value = settings.PASSWORD;
    document.getElementById("staticip").value = settings.STATIC_IP;

    document.getElementById("ssidap").value = settings.SSIDAP;
    document.getElementById("passwordap").value = settings.PASSWORDAP;

    if(document.getElementById("lamp" + settings.LAMP)){
        document.getElementById("lamp" + settings.LAMP).checked = true;;
    }
    else{
        document.getElementById("lamp1").checked = true;;
    }
    setLampModeDependencies();

    document.getElementById("color_r").value = settings.COLOR_R;
    document.getElementById("color_g").value = settings.COLOR_G;
    document.getElementById("color_b").value = settings.COLOR_B;
    if(mainColor){
        mainColor.color.rgb = { r: settings.COLOR_R, g: settings.COLOR_G, b: settings.COLOR_B };
    }

    document.getElementById("color_alt_r").value = settings.COLOR_ALT_R;
    document.getElementById("color_alt_g").value = settings.COLOR_ALT_G;
    document.getElementById("color_alt_b").value = settings.COLOR_ALT_B;
    if(secondaryColor){
        secondaryColor.color.rgb = { r: settings.COLOR_ALT_R, g: settings.COLOR_ALT_G, b: settings.COLOR_ALT_B };
    }

    document.getElementById("interval").value = settings.INTERVAL;
    document.getElementById("steps").value = settings.STEPS;

    document.getElementById("ssl").checked = (settings.SSL == "0") ? false : "checked";
    document.getElementById("host").value = settings.HOST;
    document.getElementById("port").value = settings.PORT;
    document.getElementById("path").value = settings.PATH;
    document.getElementById("fingerprint").value = settings.FINGERPRINT;

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

    settings.SSID = document.getElementById("ssid").value;
    settings.PASSWORD = document.getElementById("password").value;
    settings.STATIC_IP = document.getElementById("staticip").value;

    settings.SSIDAP = document.getElementById("ssidap").value;
    settings.PASSWORDAP = document.getElementById("passwordap").value;

    settings.LAMP = 6;
    var radios = document.getElementsByName('lamp');
    for (var i = 0, length = radios.length; i < length; i++)
    {
        if (radios[i].checked){
            settings.LAMP = radios[i].value;
            break;
        }
    }
    setLampModeDependencies();

    settings.COLOR_R = document.getElementById("color_r").value;
    settings.COLOR_G = document.getElementById("color_g").value;
    settings.COLOR_B = document.getElementById("color_b").value;
    settings.COLOR_ALT_R = document.getElementById("color_alt_r").value;
    settings.COLOR_ALT_G = document.getElementById("color_alt_g").value;
    settings.COLOR_ALT_B = document.getElementById("color_alt_b").value;

    settings.SSL = (document.getElementById("ssl").checked)? '1' : '0';
    settings.HOST = document.getElementById("host").value;
    settings.PORT = document.getElementById("port").value;
    settings.PATH = document.getElementById("path").value;
    settings.FINGERPRINT = document.getElementById("fingerprint").value;

}

var setLampModeDependencies = function(){

    var mainColorContainer = document.getElementById("main-color-container");
    var secondaryColorContainer = document.getElementById("secondary-color-container");
    var intervalContainer = document.getElementById("interval-container");
    // rainbow mode
    if(settings.LAMP == 1 || settings.LAMP == 7){
        mainColorContainer.style.display = "none";
    }
    else{
        mainColorContainer.style.display = "block";
    }
    if(settings.LAMP == 2 || settings.LAMP == 5){
        secondaryColorContainer.style.display = "block";
    }
    else{
        secondaryColorContainer.style.display = "none";
    }
    var stepsContainer = document.getElementById("steps-container");
    if(settings.LAMP == 5){
        stepsContainer.style.display = "block";
    }
    else{
        stepsContainer.style.display = "none";
    }
    if(settings.LAMP == 6 ){
        intervalContainer.style.display = "none";
    }
    else{
        intervalContainer.style.display = "block";
    }

}

var initializeForm = function(){
    if(!initialized)
    {
        initialized = true;
        mainColor = new iro.ColorPicker("#main-color", {
            width: 320,
            height: 320,
            color: {r: settings.COLOR_R, g: settings.COLOR_G, b: settings.COLOR_B},
        });
        secondaryColor = new iro.ColorPicker("#secondary-color", {
            width: 320,
            height: 320,
            color: {r: settings.COLOR_ALT_R, g: settings.COLOR_ALT_G, b: settings.COLOR_ALT_B},
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
        intervalRange.setValue(settings.INTERVAL);
        intervalRange.onValueChange(() => {
            document.getElementById("interval").value = intervalRange.getValue();
            settings.INTERVAL = intervalRange.getValue();
            sendSingleCONF("INTERVAL",intervalRange.getValue())
        });

        let inputStepsElement = document.getElementById('steps');
        let outputStepsElement = document.getElementById('steps_output');
        let stepsRange = new Range(inputStepsElement, outputStepsElement, () => {});
        stepsRange.setValue(settings.STEPS);
        stepsRange.onValueChange(() => {
            document.getElementById("steps").value = stepsRange.getValue();
            settings.STEPS = stepsRange.getValue();
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

    var j={"device":"control","action":"save-single","conf":conf,"value":value};

    var configurations =  JSON.stringify(j);

    if(debug){console.log( 'conf: ' + configurations ); }

    try{
        connection.send(configurations );
        formNotify.style.background = 'green';
        formNotify.innerHTML =  "Single configuration sent!" ;
        if(debug){console.log("Single configuration sent!" );}
    }catch(err){
        formNotify.style.background = 'orange';
        formNotify.innerHTML =  "Single configuration not sent!" ;
        if(debug){console.log(err);}
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


    var j = extend({"device":"control","action":"save-all"}, settings);

    var configurations =  JSON.stringify(j);//'<#' + implode(arr, separatorChar);
    if(debug){console.log( 'conf: ' + configurations ); }

    try{
        connection.send(configurations );
        formNotify.style.background = 'green';
        formNotify.innerHTML =  "All configuration sent!" ;
        if(debug){console.log("All configuration sent!" );}
    }catch(err){
        formNotify.style.background = 'orange';
        formNotify.innerHTML =  "All configuration not sent!" ;
        if(debug){console.log(err);}
    }
    return;
}

var implode = function( array, separator ){
    return Object.keys(array).map(function(x){return array[x];}).join(separator)
}

var resetLamp = function(){

    var j={"device":"control","action":"reset"};

    var configurations =  JSON.stringify(j);

    connection.send(configurations);
    document.getElementById("submit").classList.add("disabled");
    location.reload();
}

var restartLamp = function(){

    var j={"device":"control","action":"restart"};

    var configurations =  JSON.stringify(j);

    connection.send(configurations);
    document.getElementById("submit").classList.add("disabled");
    location.reload();
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

            if(debug){console.log("Connection ready!" );}
            var j={"device":"control","action":"connected"};
            var configurations =  JSON.stringify(j);
            connection.send(configurations);

            /*if(debug){console.log('WebSocket open connection ');}
            var j2={"device":"control","action":"read-all"};
            var configurations2 =  JSON.stringify(j2);
            connection.send(configurations2);*/
        };
        connection.onerror = function (error) {
            if(debug){console.log('WebSocket Error ', error);}
        };
        connection.onmessage = function (e) {
            if(typeof e.data != "undefined"){
                var json = JSON.parse(e.data);
                console.log(json);
                if(typeof json.device != "undefined" && json.device == "lamp"){
                    var message = '';
                    var responseJson = {};
                    if(typeof json.action != "undefined"){
                        if(json.action == "connected"){
                            if(debug){console.log('Server: ', e.data);}
                            statusNotify.style.background = 'yellow';
                            statusNotify.innerHTML =  "Lamp Connected!" ;
                            if(debug){console.log("Lamp Connected!" );}

                            if(debug){console.log('WebSocket open connection ');}
                            var responseJson={"device":"control","action":"read-all"};
                            message =  JSON.stringify(responseJson);
                            connection.send(message);
                        }
                        if(json.action == "read-all"){
                            initVariables(json);
                            statusNotify.style.background = 'green';
                            statusNotify.innerHTML =  "Lamp Connected & Read Configuration!" ;
                            if(debug){console.log("Get configurations!" );}
                        }
                    }
                    document.getElementById("submit").classList.remove("disabled");
                    document.getElementById("reset").classList.remove("disabled");
                    document.getElementById("restart").classList.remove("disabled");
                }
            }
        };
        connection.onclose = function(e) {
            if(debug){console.log('Server: ', e.data);}
            statusNotify.style.background = 'red';
            statusNotify.innerHTML =  "WebSocket Disconnected!" ;
            if(debug){console.log("WebSocket Disconnected!" );}
        };
    }catch(err){
        statusNotify.style.background = 'red';
        statusNotify.innerHTML =  "WebSocket Disconnected!" ;
        if(debug){console.log("WebSocket Disconnected!" );}
        if(debug){console.log(err);}
    }
}

initialize();
