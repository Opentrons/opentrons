#ifndef MMR920C04_h
#define MMR920C04_h

#include <Arduino.h>
#include <Wire.h>
#define MMRADDR     0x67
//  Constants for setting measurement resolution

//
class MMR920C04
{
public:
  MMR920C04(uint8_t addr);            // Initialize the HDC2080
  void begin(void);             // Join I2C bus
  void writeReg(uint8_t tempdata);
  void readReg(uint8_t *readData, uint8_t dataLength);
  int GetDRDYBStatus(void);
private:
  int _addr;
};

#endif
