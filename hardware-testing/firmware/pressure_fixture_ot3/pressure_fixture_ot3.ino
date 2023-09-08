#include <Arduino.h>
#include<Wire.h>
#include"MMR920C04.h"
#include "TCA9548A.h"

#define VERSION ("1.0.0")

String inputString = "";         // a String to hold incoming data
bool stringComplete = false;  // whether the string is complete
int numdata=0;
String cmd = "";
MMR920C04 Pressure(MMRADDR);
TCA9548A I2CMux;              //Address can be passed into the constructor
int32_t tempPressure = 0;
double pressure[8] = {0.0};
//float pressure = 0.0;

uint8_t dataTemp[3] = {0};
float sensor_conv_pressure(uint8_t *result)
{
  int32_t data;
  float convData;

  data = (int32_t)result[2];
  data += (int32_t)result[1] * 256;
  data += (int32_t)result[0] * 256 * 256;
  data <<= 8;
  data >>= 8;
  
  convData = (float)data / pow(10, 5);

  return convData;
}
/************************************************************/
//this function used to get the pressure task
unsigned long previousGetPressureMillis = 0;
const long GetPressureinterval = 5;
volatile uint8_t PressureSampleStep = 0;
volatile uint8_t PressureChannel = 0;
void GetPressureTask(void)
{
  unsigned long currentGetPressureMillis = millis();
  if(currentGetPressureMillis-previousGetPressureMillis >= GetPressureinterval)
  {
    previousGetPressureMillis = currentGetPressureMillis;
    switch(PressureSampleStep)
    {
      case 0:
      {
        I2CMux.openChannel(PressureChannel);
        break;
      }
      case 1:
      {
        Pressure.writeReg(0x94);
        Pressure.writeReg(0xA0);
        break;
      }
      case 5:
      {
        Pressure.writeReg(0xC4);
        Pressure.readReg(dataTemp,3);
       // if((dataTemp[0]!=0)&&(dataTemp[1]!=0)&&(dataTemp[2]!=0))
        {
          pressure[PressureChannel] = sensor_conv_pressure(dataTemp);//(float)tempPressure/pow(10,5);
        
          pressure[PressureChannel] = pressure[PressureChannel]/0.0101972;         //filter conver from cmH20 to Pa
        }
        break;
      }
      case 6:
      {
        Pressure.writeReg(0x72);                      //Reset the pressure
        I2CMux.closeChannel(PressureChannel);
        PressureChannel++;
        if(PressureChannel>7)
        {
          I2CMux.closeAll();
          PressureChannel = 0;
        }
        break;
      }
      default:
      {
        //PressureSampleStep = 0;
        //PressureChannel = 0;
        break;
      }
    }
    PressureSampleStep++;
    if(PressureSampleStep>7)
    {
      PressureSampleStep = 0;
    }
    
  }
}
/************************************************************/
//this function used to report the test data task
unsigned long previousReportTestDataMillis = 0;
const long ReportTestDatainterval = 1000;
void ReportTestDataTask(void)
{
  unsigned long currentReportTestDataMillis = millis();
  if(currentReportTestDataMillis-previousReportTestDataMillis >= ReportTestDatainterval)
  {
    previousReportTestDataMillis = currentReportTestDataMillis;
    
  }
}
void setup() {
  // put your setup code here, to run once:
    // initialize serial:
  Serial.begin(115200);
  // reserve 200 bytes for the inputString:
  inputString.reserve(200);
  //Pressure.begin();

  I2CMux.begin(Wire);             // Wire instance is passed to the library

  I2CMux.closeAll();              // Set a base state which we know (also the default state on power on)
}
void loop() {
  // put your main code here, to run repeatedly:
   GetPressureTask();
 /*
   Serial.println("--- Opening single channels --- ");
  for(uint8_t x = 0; x < 8; x++)
  {
    Serial.print("Opening << Channel: ");   
    Serial.println(x); 

    I2CMux.openChannel(x);    // Open channel
    
    delay(500);
    Pressure.writeReg(0x94);
    Pressure.writeReg(0xA0);
    //Serial.print("Register = Value: ");
    //Serial.println(I2CMux.readRegister());   // Note here, register does not translate directly to channel number
    I2CMux.readRegister();
    delay(500);  
     Pressure.writeReg(0xC0);
    Pressure.readReg(dataTemp,3);
    pressure = (float)((uint32_t)dataTemp[0]<<16|(uint32_t)dataTemp[1]<<8|(uint32_t)dataTemp[2])/10000.0;
     Serial.print("Pressure = Value: ");
      Serial.println(pressure);
    //Serial.print("Closing >> Channel: ");   
    //Serial.println(x); 

    I2CMux.closeChannel(x);   // Close channel

    delay(500); 
  }
  */

}
void processCmdParse(String strCMD,int tempData)
{
  //use to set the DAC Value
  if(strCMD == "DAC")                    //set the dac output value
  {
    Serial.println("DAC");
  }
  else if (strCMD == "VERSION") {
    Serial.println(VERSION);
  }
  else if(strCMD == "GETPRESSURE")
  {
    //Serial.print("PRESSURE = ");
    //Serial.println(pressure);
    if((tempData>0)&&(tempData<9))
    {
      Serial.print("PRESSURE");
      Serial.print(tempData);
      Serial.print("= ");
      Serial.println(pressure[tempData-1], 2);
     // Serial.println("OK");1`
    }
    else if(tempData == 0x0F)                    //channel all;
    {
      //Serial.print("ADCONBOARDALL= ");
      for(int i=0;i<8;i++)
      {
        Serial.print("PRESSURE");
        Serial.print(i+1);
        Serial.print("= ");
         Serial.print(pressure[i], 2);
        Serial.print(",");
      }
      Serial.println("");
    }
    else
    {
      Serial.print("Wrong Channel!");
    }
  }
  else
  {
    Serial.println("Wrong CMD!");
  }
}
/*
  SerialEvent occurs whenever a new data comes in the hardware serial RX. This
  routine is run between each time loop() runs, so using delay inside loop can
  delay response. Multiple bytes of data may be available.
*/
void serialEvent() {
  while(Serial.available()) {
    // get the new byte:
    char inChar = (char)Serial.read();
    // add it to the inputString:
    inputString += inChar;
    // if the incoming character is a newline, set a flag so the main loop can
    // do something about it:
    if (inChar == '\n') {
      stringComplete = true;
    }
  }
  if(stringComplete)
  {
    int i=0,j=0;
    numdata = 0;
    
    stringComplete = false;
    while((i<inputString.length()-2)&&(inputString[i] != ':'))
    {
        cmd += (char)inputString[i];
        i++;
        j=i+1;
    }
    while((j<inputString.length()-2)&&(inputString[j+1] != '\n'))
    {
        numdata=numdata*10+(inputString[j]-'0');
        j++;
    }
    /*****************************/
    //add some code to process the cmd parse
    processCmdParse(cmd,numdata);
    /******************************/
    inputString = "";
    cmd = "";
  }
}
