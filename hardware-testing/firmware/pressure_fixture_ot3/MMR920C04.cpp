#include "MMR920C04.h"

#include <Wire.h>

#define MMR920C04_CMD_RESET (0x72)

MMR920C04::MMR920C04() {
}

void MMR920C04::begin(void) {
    Wire.begin();
    Wire.setClock(MMR920C04_I2C_FREQ);
}

void MMR920C04::reset(void) {
    writeReg(MMR920C04_CMD_RESET);
}

void MMR920C04::readReg(uint8_t *readData, uint8_t dataLength) {
    Wire.requestFrom(MMR920C04_I2C_ADDR, dataLength);
    // TODO: delay a bit here?
    if (Wire.available() < dataLength) {
        return
    }
    for(uint8_t i = 0; i < dataLength; i++) {
        readData[i] = Wire.read();
    }
}

void MMR920C04::writeReg(uint8_t data) {
  Wire.beginTransmission(MMR920C04_I2C_ADDR);
  Wire.write(data);
  Wire.endTransmission();
}
