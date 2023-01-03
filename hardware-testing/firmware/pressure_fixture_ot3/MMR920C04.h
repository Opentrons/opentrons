#ifndef MMR920C04_h
#define MMR920C04_h

#include <Arduino.h>
#include <Wire.h>

#define MMR920C04_I2C_ADDR (0x67)
#define MMR920C04_I2C_FREQ (100000)

class MMR920C04 {
    public:
        MMR920C04();
        void begin(void);
        void reset(void);
        void writeReg(uint8_t data);
        void readReg(uint8_t *readData, uint8_t dataLength);
    private:
        TwoWire *myWire;
};

#endif
