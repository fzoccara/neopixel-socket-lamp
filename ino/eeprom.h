
/* EEPROM VARIABLE INDEXES */
int getEpromIndex(int fromTo, int variable){
  
  int indexFrom = 0;
  int indexTo = 0;

  switch (variable){
    case VARIABLE_SSID:
      indexFrom = 0;
      indexTo =32;
      break;
    case VARIABLE_PASSWORD:
      indexFrom = 32;
      indexTo = 96;
      break;
    case VARIABLE_MODE:
      indexFrom = 96;
      indexTo = 97;
      break;
    case VARIABLE_SSIDAP:
      indexFrom = 97;
      indexTo = 129;
      break;
    case VARIABLE_PASSWORDAP:
      indexFrom = 129;
      indexTo = 193;
      break;
    case VARIABLE_STATIC_IP:
      indexFrom = 193;
      indexTo = 208;
      break;
    case VARIABLE_LAMP:
      indexFrom = 208;
      indexTo = 210;
      break;
    case VARIABLE_COLOR_R:
      indexFrom = 210;
      indexTo = 213;
      break;
    case VARIABLE_COLOR_G:
      indexFrom = 213;
      indexTo = 216;
      break;
    case VARIABLE_COLOR_B:
      indexFrom = 216;
      indexTo = 219;
      break;
    case VARIABLE_COLOR_ALT_R:
      indexFrom = 219;
      indexTo = 222;
      break;
    case VARIABLE_COLOR_ALT_G:
      indexFrom = 222;
      indexTo = 225;
      break;
    case VARIABLE_COLOR_ALT_B:
      indexFrom = 225;
      indexTo = 228;
      break;
    case VARIABLE_INTERVAL:
      indexFrom = 228;
      indexTo = 238;
      break;
    case VARIABLE_STEPS:
      indexFrom = 238;
      indexTo = 248;
      break;
    case VARIABLE_SSL:
      indexFrom = 248;
      indexTo = 249;
      break;
    case VARIABLE_HOST:
      indexFrom = 249;
      indexTo = 300;
      break;
    case VARIABLE_PORT:
      indexFrom = 300;
      indexTo = 306;
      break;
    case VARIABLE_PATH:
      indexFrom = 306;
      indexTo = 406;
      break;
    case VARIABLE_FINGERPRINT:
      indexFrom = 406;
      indexTo = 466;
      break;

    default:
      break;
  }
  if(fromTo == 1){
    return indexFrom;
  }
  if(fromTo == 2){
    return indexTo;
  }
  return 0;
}
/* EEPROM VARIABLE INDEXES */

/* EEPROM READ */
String readFromEeprom(int variable){

  int indexFrom = getEpromIndex(1,variable);
  int indexTo = getEpromIndex(2,variable);

  if(indexTo != 0){

    EEPROM.begin(512);
    String value;
    for (int i = indexFrom; i < indexTo; ++i){
        value += char(EEPROM.read(i));
    }
    //if (logging){Serial.print(variable);}
    //if (logging){Serial.print(": ");}
    //if (logging){Serial.println(value);}
    EEPROM.end();
    
    if ( value.charAt(0) ) {  
      return value.c_str();
    }
  }
  return "";
}
/* EEPROM READ */

/* EEPROM WRITE */
void writeToEeprom(int variable, String value){

  if (logging){Serial.print("Writing EEPROM ");}
  if (logging){Serial.print(value);}
  if (logging){Serial.print(" on ");}
  if (logging){Serial.println(variable);}
  
  int indexFrom = getEpromIndex(1,variable);
  int indexTo = getEpromIndex(2,variable);

  if(indexTo>0){// && value.length()>0){
    EEPROM.begin(512);
    delay(10);
    
    if (logging){ Serial.println("clearing eeprom");}
    for (int i = indexFrom; i < indexTo; ++i) { EEPROM.write(i, 0); }
    
    for (int i = 0; i < value.length(); ++i){
      EEPROM.write(indexFrom+i, value[i]);
      if (logging){ Serial.print(indexFrom+i);}
      if (logging){ Serial.print(": ");}
      if (logging){ Serial.println(value[i]);}
    }
    if (logging){ Serial.println("");}
    
    EEPROM.commit();
    delay(10);
    EEPROM.end();
    delay(10);
  }
  
}
/* EEPROM WRITE */

/* EEPROM VARIABLES RESET */
void clearEeprom(){
  EEPROM.begin(512);
  if (logging){ Serial.println("clearing eeprom");}
  for (int i = 0; i < 512; ++i) { EEPROM.write(i, 0); }
  EEPROM.commit();
  EEPROM.end();
}
/* EEPROM VARIABLES RESET */

/* INIT EEPROM VARIABLES FROM DEFAULT CONFIGURATION */
void initEpromVariables(bool forceInit)
{
  SPIFFS.begin();

  if (forceInit || !SPIFFS.exists("/variableInitialized.txt")) {

    if (logging){ Serial.println("Initialize Variables");}
    
    File file = SPIFFS.open("/variableInitialized.txt", "w");
    if (!file) {
        if (logging){ Serial.println("file open failed");}
    } else {
      
      writeToEeprom(VARIABLE_SSID,"");
      writeToEeprom(VARIABLE_PASSWORD,"");
      writeToEeprom(VARIABLE_MODE,String(WIFI_STATUS_NO_CONNECTION));
      writeToEeprom(VARIABLE_SSIDAP,ssidAPDefault);
      writeToEeprom(VARIABLE_PASSWORDAP,passwordAPDefault);
      writeToEeprom(VARIABLE_STATIC_IP,"");
      writeToEeprom(VARIABLE_LAMP,"1");
      writeToEeprom(VARIABLE_COLOR_R,"255");
      writeToEeprom(VARIABLE_COLOR_G,"255");
      writeToEeprom(VARIABLE_COLOR_B,"0");
      writeToEeprom(VARIABLE_COLOR_ALT_R,"0");
      writeToEeprom(VARIABLE_COLOR_ALT_G,"0");
      writeToEeprom(VARIABLE_COLOR_ALT_B,"50");
      writeToEeprom(VARIABLE_INTERVAL,"100");
      writeToEeprom(VARIABLE_STEPS,"50");

      writeToEeprom(VARIABLE_SSL,"1");
      writeToEeprom(VARIABLE_HOST,"fzoccara.herokuapp.com");
      writeToEeprom(VARIABLE_PORT,"443");
      writeToEeprom(VARIABLE_PATH,"/");
      writeToEeprom(VARIABLE_FINGERPRINT,"08 3B 71 72 02 43 6E CA ED 42 86 93 BA 7E DF 81 C4 BC 62 30");

      file.println("Lamp Initialized");
      
      if (logging){ Serial.println("Variables initialized");}
    }
  } else {
    if (logging){ Serial.println("Variables already initialized. Moving along...");}
  }
}
/* INIT EEPROM VARIABLES FROM DEFAULT CONFIGURATION */

/* CLEAR ALL FILES IN EEPROM */
void formatEeprom()
{
  SPIFFS.begin();

  if (!SPIFFS.exists("/formatComplete.txt")) {
    if (logging){ Serial.println("Please wait 30 secs for SPIFFS to be formatted");}
    SPIFFS.format();
    if (logging){ Serial.println("Spiffs formatted");}
    
    File file = SPIFFS.open("/formatComplete.txt", "w");
    if (!file) {
        if (logging){ Serial.println("file open failed");}
    } else {
        file.println("Format Complete");
    }
  } 
  else 
  {
    if (logging){ Serial.println("SPIFFS is formatted. Moving along...");}
  }
  
}
/* CLEAR ALL FILES IN EEPROM */

