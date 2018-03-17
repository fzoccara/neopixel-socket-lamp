
/* READ FILE FROM NODEMCU DISK */
String readFile(String filename){
  
  String content = "";
  if (logging){ Serial.println("Prepare file system");}
  SPIFFS.begin();
  
  File file = SPIFFS.open(filename, "r");
  if (!file) {
    if (logging){ Serial.println("file open failed");  }
  } else{
    if (logging){ Serial.println("file open success"); }

    while (file.available()) {
      //Serial.write(file.read());
      String line = file.readStringUntil('\n');
      content += line + "\n";
    }
    file.close();
    
    return content;
  }
  return "Not Found";
}
/* READ FILE FROM NODEMCU DISK */

/* NOT FOUND RESPONSE */
void handleNotFound(){
  
  String message = "File not found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET)?"GET":"POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i=0; i<server.args(); i++){
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
  /* NOT FOUND RESPONSE */
}

String getContentType(String filename){
  if(server.hasArg("download")) return "application/octet-stream";
  else if(filename.endsWith(".htm")) return "text/html";
  else if(filename.endsWith(".html")) return "text/html";
  else if(filename.endsWith(".css")) return "text/css";
  else if(filename.endsWith(".js")) return "application/javascript";
  else if(filename.endsWith(".png")) return "image/png";
  else if(filename.endsWith(".gif")) return "image/gif";
  else if(filename.endsWith(".jpg")) return "image/jpeg";
  else if(filename.endsWith(".ico")) return "image/x-icon";
  else if(filename.endsWith(".xml")) return "text/xml";
  else if(filename.endsWith(".pdf")) return "application/x-pdf";
  else if(filename.endsWith(".zip")) return "application/x-zip";
  else if(filename.endsWith(".gz")) return "application/x-gzip";
  return "text/plain";
}

void responseWithContent(String filename){
  /* CONTENT RESPONSE */
  String content = readFile(filename);
  String contentType = getContentType(filename);
  if (logging){Serial.print(contentType);}
  if (logging){Serial.print(" - ");}
  if (logging){Serial.println(filename);}
  if(!content){
    server.send(404, "text/html", "Not found");
  }
  else{
    server.send(200, contentType, content);
  }
}
/* CONTENT RESPONSE */

