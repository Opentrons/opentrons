#ifndef TCA9548A_H
#define TCA9548A_h

#include <Arduino.h>
#include <Wire.h>

/* Channel hex values for writeRegister() function */
#define TCA_CHANNEL_0 0x1
#define TCA_CHANNEL_1 0x2
#define TCA_CHANNEL_2 0x4
#define TCA_CHANNEL_3 0x8
#define TCA_CHANNEL_4 0x10
#define TCA_CHANNEL_5 0x20
#define TCA_CHANNEL_6 0x40
#define TCA_CHANNEL_7 0x80

const int RESET = 22;
const int Addr0 = 24;
const int Addr1 = 23;
const int Addr2 = 25;

class TCA9548A
{
    public:
        TCA9548A(uint8_t address = 0x70);  // Default IC Address

        void begin(TwoWire &inWire = Wire); // Default TwoWire Instance
        void openChannel(uint8_t channel);
        void closeChannel(uint8_t channel);
        void writeRegister(uint8_t value);
        inline byte readRegister() { return (byte)read(); }
        void closeAll();
        void openAll();
        
    protected:
    private:
        TwoWire *myWire;
        uint8_t _address;
        uint8_t _channels;

        void write(uint8_t inData);
        uint8_t read();
};

#endif
