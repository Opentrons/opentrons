#ifndef TCA9548A_H
#define TCA9548A_h

#include <Arduino.h>
#include <Wire.h>

#define TCA9548A_ADDR_MIN (0x70)
#define TCA9548A_ADDR_MAX (0x77)
#define TCA9548A_ADDR_DEFAULT TCA9548A_ADDR_MIN
#define TCA9548A_PIN_NONE (255)  // placeholder for when using defaults

class TCA9548A {
    public:
        TCA9548A(uint8_t reset = TCA9548A_PIN_NONE,
                 uint8_t addr_0 = TCA9548A_PIN_NONE,
                 uint8_t addr_1 = TCA9548A_PIN_NONE,
                 uint8_t addr_2 = TCA9548A_PIN_NONE,
                 uint8_t address = TCA9548A_ADDR_DEFAULT);
        void begin(TwoWire &inWire = Wire);
        void openChannel(uint8_t channel);
        void closeChannel(uint8_t channel);
        void closeAll();
        void openAll();
        
    protected:
    private:
        TwoWire *myWire;
        uint8_t _reset;
        uint8_t _address;
        uint8_t _pin_addr_0;
        uint8_t _pin_addr_1;
        uint8_t _pin_addr_2;
        uint8_t _channels;
        void write();
        void configAddressPin(uint8_t pin, uint8_t bit);
};

#endif
