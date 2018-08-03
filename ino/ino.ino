/*
  made by fzoccara.com with love and passion
*/
#include <Arduino.h>
#include <ESP8266WiFi.h>
//#include <ESP8266WiFiMulti.h>
#include <WebSocketsClient.h>
#include <WebSocketsServer.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <Hash.h>
//#include <WiFiClient.h>
//#include <WiFiClientSecure.h>

#include "FS.h"
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <Adafruit_NeoPixel.h>

#define WIFI_STATUS_NO_CONNECTION 0
#define WIFI_STATUS_AP 1
#define WIFI_STATUS_CLIENT 2

#define VARIABLE_SSID 0
#define VARIABLE_PASSWORD 1
#define VARIABLE_MODE 2
#define VARIABLE_STATIC_IP 3
#define VARIABLE_SSIDAP 4
#define VARIABLE_PASSWORDAP 5
#define VARIABLE_LAMP 6
#define VARIABLE_COLOR_R 7
#define VARIABLE_COLOR_G 8
#define VARIABLE_COLOR_B 9
#define VARIABLE_COLOR_ALT_R 10
#define VARIABLE_COLOR_ALT_G 11
#define VARIABLE_COLOR_ALT_B 12
#define VARIABLE_INTERVAL 13
#define VARIABLE_STEPS 14
#define VARIABLE_SSL 15
#define VARIABLE_HOST 16
#define VARIABLE_PORT 17
#define VARIABLE_PATH 18
#define VARIABLE_FINGERPRINT 19

#define LAMP_OFF 7
#define LAMP_RAINBOWCYCLE 1
#define LAMP_THEATERCHASE 2
#define LAMP_COLORWIPE 3
#define LAMP_SCANNER 4
#define LAMP_FADE 5
#define LAMP_STATIC 6
#define LAMP_COLORROTATION 8
#define LAMP_INFINITELOOP 9

int wifiStatus = WIFI_STATUS_NO_CONNECTION; // 0: no connect | 1: wifi ap | 2: wifi client

#define ledGpioPin D3
#define buttonGpioPin D4

bool logging = true;

unsigned long currentMillis = 0;
long intervalFlashEeprom = 7000; // interval for reset eeprom (milliseconds)

int pixelCount = 24;
#define pixelPin D2

//ESP8266WiFiMulti WiFiMulti;

ESP8266WebServer server (80);
WebSocketsServer webSocketServer = WebSocketsServer(81);
WebSocketsClient webSocketClient;

String lampName = (String(pixelCount) + "led-" + String(ESP.getChipId())).c_str();

String ssidAPDefault = "fzoccara-lamp-" + lampName;
String passwordAPDefault = "12345678";
const char* mdnsName = "fzoccara";

#include "ring.h";
#include "eeprom.h";
#include "spiffs.h";

/* RESET BUTTON PRESSED UP */
void resetButtonOnFinal() {
  detachInterrupt(buttonGpioPin);
  attachInterrupt(buttonGpioPin, resetButtonOn, RISING);

  if (logging) {
    Serial.println(currentMillis);
  }
  if (currentMillis + intervalFlashEeprom < millis()) {
    if (logging) {
      Serial.println("Reset Eeprom");
    }

    delay(100);
    initEpromVariables(true);
    delay(1000);
    restartEsp();

    if (logging) {
      Serial.flush();
    }
  }
}
/* RESET BUTTON PRESSED UP */

/* RESET BUTTON PRESSED DOWN */
void resetButtonOn() {
  if (logging) {
    Serial.println("");
  }
  if (logging) {
    Serial.print("Hold RESET Button 7 seconds for reset the LAMP, ");
  }
  if (logging) {
    Serial.println(currentMillis);
  }
  detachInterrupt(buttonGpioPin);
  attachInterrupt(buttonGpioPin, resetButtonOnFinal, FALLING);
  currentMillis = millis();
}
/* RESET BUTTON PRESSED DOWN */

/* SUBSTRING FROM STRING WITH DELIMITATOR */
String getString(String data, char separator, int index) {
  int found = 0;
  int strIndex[] = { 0, -1 };
  int maxIndex = data.length() - 1;

  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }

  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}
/* SUBSTRING FROM STRING WITH DELIMITATOR */

/* SET RING FROM EEPROM CONFIGURATION */
void setRing() {

  int lampMode = readFromEeprom(VARIABLE_LAMP).toInt();
  if (lampMode == 0) {
    lampMode = LAMP_RAINBOWCYCLE;
  }
  if (logging) {
    Serial.print ("Set lamp mode ");
  }
  int lampInterval = readFromEeprom(VARIABLE_INTERVAL).toInt();
  if (lampInterval == 0) {
    lampInterval = 100;
  }
  //ColorSet(Color(red, green, blue));
  int color_r = readFromEeprom(VARIABLE_COLOR_R).toInt();
  if (color_r == 0) {
    color_r = 255;
  }
  int color_g = readFromEeprom(VARIABLE_COLOR_G).toInt();
  if (color_g == 0) {
    color_g = 255;
  }
  int color_b = readFromEeprom(VARIABLE_COLOR_B).toInt();
  if (color_b == 0) {
    color_b = 0;
  }
  int color_alt_r;
  int color_alt_g;
  int color_alt_b;
  int lampSteps;
  if (logging) {
    Serial.print ("Set lamp mode ");
  }
  switch (lampMode) {
    case LAMP_OFF:
      if (logging) {
        Serial.println("OFF");
      }
      Ring.clear();
      Ring.show();
      Ring.setBrightness(0);
      break;
    case LAMP_STATIC:
      if (logging) {
        Serial.println("STATIC");
      }
      Ring.clear();
      Ring.Static(Ring.Color(color_r, color_g, color_b));
      Ring.setBrightness(255);
      break;
    case LAMP_RAINBOWCYCLE:
      if (logging) {
        Serial.println("LAMP_RAINBOWCYCLE ");
      }
      Ring.clear();
      Ring.RainbowCycle(lampInterval);
      Ring.setBrightness(255);
      break;
    case LAMP_COLORROTATION:
      if (logging) {
        Serial.println("LAMP_COLORROTATION ");
      }
      Ring.clear();
      Ring.ColorRotation(lampInterval);
      Ring.setBrightness(255);
      break;
    case LAMP_THEATERCHASE:
      if (logging) {
        Serial.println("LAMP_THEATERCHASE ");
      }
      color_alt_r = readFromEeprom(VARIABLE_COLOR_ALT_R).toInt();
      if (color_alt_r == 0) {
        color_alt_r = 0;
      }
      color_alt_g = readFromEeprom(VARIABLE_COLOR_ALT_G).toInt();
      if (color_alt_g == 0) {
        color_alt_g = 0;
      }
      color_alt_b = readFromEeprom(VARIABLE_COLOR_ALT_B).toInt();
      if (color_alt_b == 0) {
        color_alt_b = 50;
      }
      Ring.clear();
      Ring.TheaterChase(Ring.Color(color_r, color_g, color_b),
                        Ring.Color(color_alt_r, color_alt_g, color_alt_b), lampInterval);
      Ring.setBrightness(255);
      break;

    case LAMP_COLORWIPE:
      if (logging) {
        Serial.println("LAMP_COLORWIPE ");
      }
      Ring.clear();
      Ring.ColorWipe(Ring.Color(color_r, color_g, color_b), lampInterval);
      Ring.setBrightness(255);
      break;

    case LAMP_SCANNER:
      if (logging) {
        Serial.println("LAMP_SCANNER ");
      }
      Ring.clear();
      Ring.Scanner(Ring.Color(color_r, color_g, color_b), lampInterval);
      Ring.setBrightness(255);
      break;

    case LAMP_INFINITELOOP:
      if (logging) {
        Serial.println("LAMP_INFINITELOOP ");
      }
      Ring.clear();
      Ring.InfiniteLoop(Ring.Color(color_r, color_g, color_b), lampInterval);
      Ring.setBrightness(255);
      break;

    case LAMP_FADE:
      if (logging) {
        Serial.println("LAMP_FADE ");
      }
      lampSteps = readFromEeprom(VARIABLE_STEPS).toInt();
      if (lampSteps != 0) {
        lampSteps = 100;
      }
      color_alt_r = readFromEeprom(VARIABLE_COLOR_ALT_R).toInt();
      if (color_alt_r == 0) {
        color_alt_r = 0;
      }
      color_alt_g = readFromEeprom(VARIABLE_COLOR_ALT_G).toInt();
      if (color_alt_g == 0) {
        color_alt_g = 0;
      }
      color_alt_b = readFromEeprom(VARIABLE_COLOR_ALT_B).toInt();
      if (color_alt_b == 0) {
        color_alt_b = 50;
      }
      Ring.clear();
      Ring.Fade(Ring.Color(color_r, color_g, color_b),
                Ring.Color(color_alt_r, color_alt_g, color_alt_b), lampSteps, lampInterval);
      Ring.setBrightness(255);
      break;
    default:
      if (logging) {
        Serial.println("NO CONFIGURATION FOUND, police mode");
      }
      Ring.clear();
      Ring.Fade(Ring.Color(255, 0, 0), Ring.Color(0,0,255), 2, 300);
      Ring.setBrightness(255);
      break;
  }
}
/* SET RING FROM EEPROM CONFIGURATION */

void restartEsp() {
  if (logging) {
    Serial.println("restart");
  }
  delay(500);
  ESP.reset();
  if (logging) {
    Serial.flush();
  }
  if (logging) {
    Serial.println("restart done");
  }
}

/* WEB SOCKET SERVER */
void webSocketEventServer(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght) {
  if (logging) {
    Serial.println("Web Socket Event Server");
  }

  StaticJsonBuffer<768> jsonBuffer;

  switch (type) {
    case WStype_DISCONNECTED:
      if (logging) {
        Serial.printf("[%u] Disconnected!\n", num);
      }
      break;
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocketServer.remoteIP(num);
        if (logging) {
          Serial.printf("[%u] Connected from %d.%d.%d.%d - url: %s\n",
                        num, ip[0], ip[1], ip[2], ip[3], payload);
        }

        JsonObject& root = jsonBuffer.createObject();

        root["device"] = "lamp";
        root["action"] = "connected";
        root["name"] = lampName;
        root["to"] = "all";

        char buffer[255];
        root.printTo(buffer, sizeof(buffer));
        // send message to server when Connected
        webSocketServer.sendTXT(num, buffer);
      }
      break;
    case WStype_TEXT:
      {
        if (logging) {
          Serial.printf("[%u] get Text: %s\n", num, payload);
        }

        JsonObject& root = jsonBuffer.parseObject(payload);

        // Test if parsing succeeds.
        if (!root.success()) {
          Serial.println("parseObject() failed");
          return;
        }

        String sourceName = root["name"];
        String sourceDevice = root["device"];
        String sourceAction = root["action"];
        String sourceTo = root["to"];
        
        if (logging) {
          Serial.print(sourceAction);
          Serial.print(" request from ");
          Serial.println(sourceDevice);
        }

        // send lamp configuration to client
        if (sourceAction ==  "read-all" ) {
          if (logging) {
            Serial.println("read all");
          }

          JsonObject& conf = jsonBuffer.createObject();

          conf["device"] = "lamp";
          conf["action"] = "read-all";
          
          conf["name"] = lampName;
          conf["SSID"] = readFromEeprom(VARIABLE_SSID);
          conf["PASSWORD"] = readFromEeprom(VARIABLE_PASSWORD);
          conf["STATIC_IP"] = readFromEeprom(VARIABLE_STATIC_IP);
          conf["SSIDAP"] = readFromEeprom(VARIABLE_SSIDAP);
          conf["PASSWORDAP"] = readFromEeprom(VARIABLE_PASSWORDAP);
          conf["SSL"] = readFromEeprom(VARIABLE_SSL);
          conf["HOST"] = readFromEeprom(VARIABLE_HOST);
          conf["PORT"] = readFromEeprom(VARIABLE_PORT);
          conf["PATH"] = readFromEeprom(VARIABLE_PATH);
          conf["FINGERPRINT"] = readFromEeprom(VARIABLE_FINGERPRINT);

          char buffer[768];
          conf.printTo(buffer, sizeof(buffer));
          // send message to server when Connected
          webSocketServer.sendTXT(num, buffer);
        }

        // saving single configurations
        if (sourceAction ==  "save-all") {
          if (logging) {
            Serial.println("save all");
          }

          String ssid = root["SSID"];
          writeToEeprom(VARIABLE_SSID, ssid);
          String password = root["PASSWORD"];
          writeToEeprom(VARIABLE_PASSWORD, password);
          String staticIp = root["STATIC_IP"];
          writeToEeprom(VARIABLE_STATIC_IP, staticIp);
          String ssidAP = root["SSIDAP"];
          writeToEeprom(VARIABLE_SSIDAP, ssidAP);
          String passwordAP = root["PASSWORDAP"];
          writeToEeprom(VARIABLE_PASSWORDAP, passwordAP);
          String ssl = root["SSL"];
          writeToEeprom(VARIABLE_SSL, ssl);
          String host = root["HOST"];
          writeToEeprom(VARIABLE_HOST, host);
          String port = root["PORT"];
          writeToEeprom(VARIABLE_PORT, port);
          String path = root["PATH"];
          writeToEeprom(VARIABLE_PATH, path);
          String fingerprint = root["FINGERPRINT"];
          writeToEeprom(VARIABLE_FINGERPRINT, fingerprint);

          restartEsp();
        }

        // reset lamp to default configuration
        if (sourceAction == "reset") {
          if (logging) {
            Serial.println("reset all");
          }
          initEpromVariables(true);
          restartEsp();
        }

        // restart lamp
        if (sourceAction == "restart") {
          if (logging) {
            Serial.println("restart all");
          }
          restartEsp();
        }
      }
      break;

    default:
      if (logging) {
        Serial.println("No cases on webSocketEventServer"); Serial.println(num);
        Serial.println(type); Serial.println(lenght);
      }
      break;
  }
}
/* WEB SOCKET SERVER */

/* WEB SOCKET CLIENT */
void webSocketEventClient(WStype_t type, uint8_t * payload, size_t lenght) {
  if (logging) {
    Serial.println("Web Socket Event Client");
  }

  StaticJsonBuffer<768> jsonBuffer;

  switch (type) {
    case WStype_DISCONNECTED:
      if (logging) {
        Serial.printf("[WSc] Disconnected!\n");
      }
      break;
    case WStype_CONNECTED:
      {
        if (logging) {
          Serial.printf("[WSc] Connected to url: %s\n",  payload);
        }

        JsonObject& root = jsonBuffer.createObject();

        root["device"] = "lamp";
        root["action"] = "connected";
        root["name"] = lampName;
        root["to"] = "all";

        char buffer[768];
        root.printTo(buffer, sizeof(buffer));
        // send message to server when Connected
        webSocketClient.sendTXT(buffer);
      }
      break;
    case WStype_TEXT:
      {
        if (logging) {
          Serial.printf("[WSc]  get Text: %s\n", payload);
        }

        JsonObject& root = jsonBuffer.parseObject(payload);

        // Test if parsing succeeds.
        if (!root.success()) {
          Serial.println("parseObject() failed");
          return;
        }

        String sourceName = root["name"];
        String sourceDevice = root["device"];
        String sourceAction = root["action"];
        String sourceTo = root["to"];
        
        if (logging) {
          Serial.print(sourceAction);
          Serial.print(" request from ");
          Serial.println(sourceDevice);
        }

        // send lamp activation confirmation to server
        if (sourceAction ==  "connected") {
          if (logging) {
            Serial.println("connected");
          }

          JsonObject& conf = jsonBuffer.createObject();

          conf["device"] = "lamp";
          conf["action"] = "connected";
          conf["name"] = lampName;
          conf["to"] = "all";

          char buffer[768];
          conf.printTo(buffer, sizeof(buffer));
          // send message to server when Connected
          webSocketClient.sendTXT(buffer);
        }


        // send lamp configuration to server
        if (sourceAction ==  "read-all") {
          if (logging) {
            Serial.println("read all");
          }

          JsonObject& conf = jsonBuffer.createObject();

          conf["device"] = "lamp";
          conf["action"] = "read-all";
          conf["name"] = lampName;
          conf["to"] = "all";

          conf["SSID"] = readFromEeprom(VARIABLE_SSID);
          conf["PASSWORD"] = readFromEeprom(VARIABLE_PASSWORD);
          conf["STATIC_IP"] = readFromEeprom(VARIABLE_STATIC_IP);
          conf["SSIDAP"] = readFromEeprom(VARIABLE_SSIDAP);
          conf["PASSWORDAP"] = readFromEeprom(VARIABLE_PASSWORDAP);
          conf["SSL"] = readFromEeprom(VARIABLE_SSL);
          conf["HOST"] = readFromEeprom(VARIABLE_HOST);
          conf["PORT"] = readFromEeprom(VARIABLE_PORT);
          conf["PATH"] = readFromEeprom(VARIABLE_PATH);
          conf["FINGERPRINT"] = readFromEeprom(VARIABLE_FINGERPRINT);
          conf["LAMP"] = readFromEeprom(VARIABLE_LAMP);
          conf["COLOR_R"] = readFromEeprom(VARIABLE_COLOR_R);
          conf["COLOR_G"] = readFromEeprom(VARIABLE_COLOR_G);
          conf["COLOR_B"] = readFromEeprom(VARIABLE_COLOR_B);
          conf["COLOR_ALT_R"] = readFromEeprom(VARIABLE_COLOR_ALT_R);
          conf["COLOR_ALT_G"] = readFromEeprom(VARIABLE_COLOR_ALT_G);
          conf["COLOR_ALT_B"] = readFromEeprom(VARIABLE_COLOR_ALT_B);
          conf["INTERVAL"] = readFromEeprom(VARIABLE_INTERVAL);
          conf["STEPS"] = readFromEeprom(VARIABLE_STEPS);

          char buffer[768];
          conf.printTo(buffer, sizeof(buffer));
          // send message to server when Connected
          webSocketClient.sendTXT(buffer);
        }

        // saving single configurations
        if (sourceAction ==  "save-single") {
          if (logging) {
            Serial.println("save single");
          }

          String key = root["conf"];
          String value = root["value"];
          int field;

          if (key == "SSID") {
            field = VARIABLE_SSID;
          }
          if (key == "PASSWORD") {
            field = VARIABLE_PASSWORD;
          }
          if (key == "STATIC_IP") {
            field = VARIABLE_STATIC_IP;
          }
          if (key == "SSIDAP") {
            field = VARIABLE_SSIDAP;
          }
          if (key == "PASSWORDAP") {
            field = VARIABLE_PASSWORDAP;
          }
          if (key == "SSL") {
            field = VARIABLE_SSL;
          }
          if (key == "HOST") {
            field = VARIABLE_HOST;
          }
          if (key == "PORT") {
            field = VARIABLE_PORT;
          }
          if (key == "PATH") {
            field = VARIABLE_PATH;
          }
          if (key == "FINGERPRINT") {
            field = VARIABLE_FINGERPRINT;
          }
          if (key == "LAMP") {
            field = VARIABLE_LAMP;
          }
          if (key == "COLOR_R") {
            field = VARIABLE_COLOR_R;
          }
          if (key == "COLOR_G") {
            field = VARIABLE_COLOR_G;
          }
          if (key == "COLOR_B") {
            field = VARIABLE_COLOR_B;
          }
          if (key == "COLOR_ALT_R") {
            field = VARIABLE_COLOR_ALT_R;
          }
          if (key == "COLOR_ALT_G") {
            field = VARIABLE_COLOR_ALT_G;
          }
          if (key == "COLOR_ALT_B") {
            field = VARIABLE_COLOR_ALT_B;
          }
          if (key == "INTERVAL") {
            field = VARIABLE_INTERVAL;
          }
          if (key == "STEPS") {
            field = VARIABLE_STEPS;
          }

          writeToEeprom(field, value);

          setRing();
        }

        // saving single configurations
        if (sourceAction ==  "save-all") {
          if (logging) {
            Serial.println("save all");
          }

          String ssid = root["SSID"];
          writeToEeprom(VARIABLE_SSID, ssid);
          String password = root["PASSWORD"];
          writeToEeprom(VARIABLE_PASSWORD, password);
          String staticIp = root["STATIC_IP"];
          writeToEeprom(VARIABLE_STATIC_IP, staticIp);
          String ssidAP = root["SSIDAP"];
          writeToEeprom(VARIABLE_SSIDAP, ssidAP);
          String passwordAP = root["PASSWORDAP"];
          writeToEeprom(VARIABLE_PASSWORDAP, passwordAP);
          String ssl = root["SSL"];
          writeToEeprom(VARIABLE_SSL, ssl);
          String host = root["HOST"];
          writeToEeprom(VARIABLE_HOST, host);
          String port = root["PORT"];
          writeToEeprom(VARIABLE_PORT, port);
          String path = root["PATH"];
          writeToEeprom(VARIABLE_PATH, path);
          String fingerprint = root["FINGERPRINT"];
          writeToEeprom(VARIABLE_FINGERPRINT, fingerprint);
          String lamp = root["LAMP"];
          writeToEeprom(VARIABLE_LAMP, lamp);
          String colorR = root["COLOR_R"];
          writeToEeprom(VARIABLE_COLOR_R, colorR);
          String colorG = root["COLOR_G"];
          writeToEeprom(VARIABLE_COLOR_G, colorG);
          String colorB = root["COLOR_B"];
          writeToEeprom(VARIABLE_COLOR_B, colorB);
          String colorAltR = root["COLOR_ALT_R"];
          writeToEeprom(VARIABLE_COLOR_ALT_R, colorAltR);
          String colorAltG = root["COLOR_ALT_G"];
          writeToEeprom(VARIABLE_COLOR_ALT_G, colorAltG);
          String colorAltB = root["COLOR_ALT_B"];
          writeToEeprom(VARIABLE_COLOR_ALT_B, colorAltB);
          String interval = root["INTERVAL"];
          writeToEeprom(VARIABLE_INTERVAL, interval);
          String steps = root["STEPS"];
          writeToEeprom(VARIABLE_STEPS, steps);

          restartEsp();
        }

        // reset lamp to default configuration
        if (sourceAction == "reset") {
          if (logging) {
            Serial.println("reset");
          }

          initEpromVariables(true);
          restartEsp();

        }

        // restart lamp
        if (sourceAction == "restart") {
          if (logging) {
            Serial.println("restart");
          }

          restartEsp();
        }
      }
      break;

    default:
      if (logging) {
        Serial.println("No cases on webSocketEventClient");
        Serial.println(type); Serial.println(lenght);
      }
      break;
  }
}
/* WEB SOCKET CLIENT */

void setUpServer() {

  IPAddress myIP = WiFi.softAPIP();
  if (logging) {
    Serial.print("AP IP address: ");
    Serial.println(myIP);
  }

  if (!MDNS.begin(mdnsName)) {
    if (logging) {
      Serial.println("Error setting up mDNS responder!");
    }
  }
  else {
    if (logging) {
      Serial.println("mDNS responder started"); Serial.print("AP domain: ");
      Serial.print(mdnsName); Serial.println(".local");
    }
  }

  server.onNotFound(handleNotFound);
  server.on("/", []() {
    responseWithContent("/index.html");
  });
  server.on("/index-full.html", []() {
    responseWithContent("/index-full.html");
  });
  server.on("/scripts.js", []() {
    responseWithContent("/scripts.js");
  });
  server.on("/style.css", []() {
    responseWithContent("/style.css");
  });
  server.on("/range.js", []() {
    responseWithContent("/range.js");
  });
  server.on("/iro.min.js", []() {
    responseWithContent("/iro.js");
  });

  server.begin();

  // Add service to MDNS
  MDNS.addService("http", "tcp", 80);
  MDNS.addService("ws", "tcp", 81);

  if (logging) {
    Serial.println("HTTP server started");
  }
}

/* TEST WIFI */
bool testWifi() {
  int i = 0;
  while (WiFi.status() != WL_CONNECTED) {
    if ( i++ > 50 ) {
      if (logging) {
        Serial.println("");
        Serial.println("Connect timed out");
      }
      return false;
    }
    blinkLed(1);
    if (logging) {
      Serial.print(WiFi.status());
    }
  }
  if (logging) {
    Serial.println();
    Serial.println(WiFi.localIP());
  }
  return true;
}
/* TEST WIFI */

bool wifiSTA() {

  if(WiFi.status() == WL_CONNECTED ){
    return true;
  }
  
  String esid = readFromEeprom(VARIABLE_SSID);
  String epass = readFromEeprom(VARIABLE_PASSWORD);

  if ( esid.charAt(0) && epass.charAt(0)) {
    if (logging) {
      Serial.println("go for connect to wifi!");
      Serial.print("Connecting to "); Serial.println(esid);
    }
    WiFi.begin(esid.c_str(), epass.c_str());
    if (testWifi()) {
      digitalWrite (ledGpioPin, LOW);
      if (logging) {
        Serial.println("WiFi connection success!");
      }
      blinkLed(3);
      return true;
    }
    else {
      digitalWrite (ledGpioPin, HIGH);
      if (logging) {
        Serial.println("WiFi connection failed!");
      }
    }
    WiFi.disconnect();
  }
  return false;
}

/* WIFI ACCESS POINT */
void wifiAP() {

  String ssidap = readFromEeprom(VARIABLE_SSIDAP);
  String passwordap = readFromEeprom(VARIABLE_PASSWORDAP);

  if (logging) {
    Serial.print("Access point to ssid: ");
    Serial.println(ssidap.c_str());
  }

  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssidap.c_str(), passwordap.c_str());

  setUpServer();

}
/* WIFI ACCESS POINT */

/* LED */
void blinkLed(int times) {

  for (uint8_t i = 0; i < times; i++) {
    digitalWrite (ledGpioPin, HIGH);
    delay(250);
    digitalWrite (ledGpioPin, LOW);
    delay(250);
  }

}
/* LED */

// Initialize everything and prepare to start
void setup_resetall()
{
  if (logging) {
    Serial.begin(115200);
    Serial.println();
  }
  formatEeprom();
  clearEeprom();
}

void setup()
{
  if (logging) {
    Serial.begin(115200); Serial.println();
  }
//initEpromVariables(true);
  
  /* INIT VARIABLES for VERY FIRST EXCECUTION */
  initEpromVariables(false);
  /* INIT VARIABLES for VERY FIRST EXCECUTION */

  /* SETUP PINS */
  pinMode(ledGpioPin, OUTPUT);  // declare Led as output
  pinMode(buttonGpioPin, INPUT);  // declare Button as input
  attachInterrupt(buttonGpioPin, resetButtonOn, RISING);
  /* SETUP PINS */

  /* PixelStrips */
  Ring.begin();
  setRing();
  /* PixelStrips */

  /* CONNECT WIFI OR CREATE ACCESS POINT */
  if (logging) {
    Serial.println("Check what to do with WiFi..");
  }

  if (wifiSTA()) {
    if (logging) {
      Serial.println("Wifi station MODE!");
    }
    wifiStatus = WIFI_STATUS_CLIENT;
    // start webSocket client
    int ssl = readFromEeprom(VARIABLE_SSL).toInt();
    String host = readFromEeprom(VARIABLE_HOST);
    String port = readFromEeprom(VARIABLE_PORT);
    String path = readFromEeprom(VARIABLE_PATH);

    if (logging) {
      Serial.println("WebSocketClient begin");
    }
    if(ssl == 1){
      String fingerprint = readFromEeprom(VARIABLE_FINGERPRINT);
      webSocketClient.beginSSL(host.c_str(), port.toInt(), path.c_str(), fingerprint.c_str());
    }
    else{
      webSocketClient.begin(host, port.toInt(), path);
    }

    //webSocketClient.begin("192.168.1.101", 80, "/");
    //webSocketClient.beginSSL("fzoccara.herokuapp.com", 443,
    //"/","08 3B 71 72 02 43 6E CA ED 42 86 93 BA 7E DF 81 C4 BC 62 30");
    //webSocketClient.beginSSL("fzoccara-lamps.azurewebsites.net", 443,
    //"/","3A B0 B1 C2 7F 74 6F D9 0C 34 F0 D6 A9 60 CF 73 A4 22 9D E8");

    webSocketClient.onEvent(webSocketEventClient);
  }
  else {
    if (logging) {
      Serial.println("Access Point MODE!");
    }
    wifiStatus = WIFI_STATUS_AP;
    wifiAP();

    webSocketServer.begin();
    webSocketServer.onEvent(webSocketEventServer);
    
    if (logging) {
      Serial.println("webSocketServer begin");
    }
  }
  /* CONNECT WIFI OR CREATE ACCESS POINT */
}

// Main loop
void loop()
{
  /* PixelStrips */
  Ring.Update();
  /* PixelStrips */

  /* WEBSOCKET */
  if (wifiStatus == WIFI_STATUS_CLIENT) {
    webSocketClient.loop();
  }
  else {
    webSocketServer.loop();
  }
  server.handleClient();
  /* WEBSOCKET */
}

// Ring Completion Callback
void RingComplete()
{
  Ring.Reverse();
}
