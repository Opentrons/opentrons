#include "MMR920C04.h"
#include <Wire.h>

//Define Register Map


MMR920C04::MMR920C04(uint8_t addr)
{
  _addr = addr;
}

void MMR920C04::begin(void)
{
  Wire.begin();
  Wire.setClock(100000);
}
int MMR920C04::GetDRDYBStatus(void)
{
  //return digitalRead(DRDYB);
}
void MMR920C04::readReg(uint8_t *readData, uint8_t dataLength)
{
  //Wire.beginTransmission(_addr);
  //Wire.write(0x01);  //set Address Pointer Register as conf Register
  //Wire.endTransmission();
  Wire.requestFrom(_addr, dataLength); // Request 1 byte from open register
  if (Wire.available() == 0)
  {
    for(uint8_t i = 0; i<dataLength; i++)
    {
      readData[i] = 0;
    }
  }
  else
  {
    for(uint8_t i = 0; i<dataLength; i++)
    {
      readData[i] = Wire.read();
    }
  }
}

void MMR920C04::writeReg(uint8_t tempdata)
{

  Wire.beginTransmission(_addr); // Open Device
  Wire.write(tempdata);        // Write data to register
  Wire.endTransmission();      // Relinquish bus control
}
/*
void MMR920C04::Sensor_reset()    //Reset the sensor
{
  writeReg(0x72);
}
void MMR920C04::Sensor_start()
{
  writeReg(0xA6);
}
*/
