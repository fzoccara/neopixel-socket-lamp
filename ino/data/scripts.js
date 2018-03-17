var connection = null;
var debug = true;
var separatorChar = "|";
var formNotify,statusNotify;

var settings = {};

var initVariables = function(json){

    settings.SSID = (typeof json.SSID != "undefined") ? json.SSID : "";
    settings.PASSWORD = (typeof json.PASSWORD != "undefined") ? json.PASSWORD: "";
    settings.MODE = (typeof json.MODE != "undefined") ? json.MODE: "";
    settings.STATIC_IP = (typeof json.STATIC_IP != "undefined") ? json.STATIC_IP: "";

    settings.SSIDAP = (typeof json.SSIDAP != "undefined") ? json.SSIDAP: "fzoccara-lamp";
    settings.PASSWORDAP = (typeof json.PASSWORDAP != "undefined") ? json.PASSWORDAP: "12345678";

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

    settings.SSL = (document.getElementById("ssl").checked)? '1' : '0';
    settings.HOST = document.getElementById("host").value;
    settings.PORT = document.getElementById("port").value;
    settings.PATH = document.getElementById("path").value;
    settings.FINGERPRINT = document.getElementById("fingerprint").value;

}

var initializeForm = function(){

    window.onresize = function(event) {
    };

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

function extend(){
    for(var i=1; i<arguments.length; i++)
        for(var key in arguments[i])
            if(arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
    return arguments[0];
}

var sendAllCONF = function( ){
	setVariables();
    
	var j = extend({"device":"control","action":"save-all"}, settings);

    var configurations =  JSON.stringify(j);
    if(debug){console.log( 'conf: ' + configurations ); }

	formNotify = document.getElementById("formChecker");
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

        var HOST = location.origin.replace(/^http/, 'ws');
        connection = new WebSocket(HOST + ":81", ['arduino']);

        connection.onopen = function () {
            statusNotify.style.background = 'orange';
            statusNotify.innerHTML =  "Connection ready!" ;

            if(debug){console.log("Connection ready!" );}
		    var j={"device":"control","action":"connected"};
	        var configurations =  JSON.stringify(j); 
            connection.send(configurations);

            if(debug){console.log('WebSocket open connection ');}
		    j={"device":"control","action":"read-all"};
	        configurations =  JSON.stringify(j); 
			connection.send(configurations);
        };
        connection.onerror = function (error) {
            if(debug){console.log('WebSocket Error ', error);}
        };
        connection.onmessage = function (e) {
        	if(typeof e.data != "undefined"){
                var json = JSON.parse(e.data);
                console.log(json);
                if(typeof json.device != "undefined" && json.device == "lamp"){
                	if(typeof json.action != "undefined"){
                		if(json.action == "connected"){
				            if(debug){console.log('Server: ', e.data);}
				            statusNotify.style.background = 'green';
				            statusNotify.innerHTML =  "Lamp Connected!" ;
				            if(debug){console.log("Lamp Connected!" );}
                    	}
                    	if(json.action == "read-all"){
		        			initVariables(json);
		        			statusNotify.style.background = 'green';
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
