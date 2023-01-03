#include "TCA9548A.h"

TCA9548A::TCA9548A(uint8_t reset, uint8_t addr_0, uint8_t addr_1, uint8_t addr_2, uint8_t address) {
    _reset = reset;
    _address = address;
    _pin_addr_0 = addr_0;
    _pin_addr_1 = addr_1;
    _pin_addr_2 = addr_2;
}

void TCA9548A::configAddressPin(uint8_t pin, uint8_t bit) {
    if (pin == TCA9548A_PIN_NONE) {
        return;
    }
    pinMode(pin, OUTPUT);
    if ((_address - TCA9548A_ADDR_MIN) & bit) {
        digitalWrite(pin, HIGH);
    }
    else {
        digitalWrite(pin, LOW);
    }
}

void TCA9548A::begin(TwoWire &inWire) {
    myWire = &inWire;
    configAddressPin(_pin_addr_0, 0x01);
    configAddressPin(_pin_addr_1, 0x02);
    configAddressPin(_pin_addr_2, 0x04);
    // reset the device (active LOW)
    if (_reset != TCA9548A_PIN_NONE) {
        pinMode(_reset, OUTPUT);
        digitalWrite(_reset, LOW);
        delay(10);
        digitalWrite(_reset, HIGH);
    }
}

void TCA9548A::openChannel(uint8_t channel) {
    _channels += (1 << channel);
    write();
}

void TCA9548A::closeChannel(uint8_t channel) {
    _channels -= (1 << channel);
    write();
}

void TCA9548A::closeAll() {
    _channels = 0x00;
    write();
}

void TCA9548A::openAll() {
    _channels = 0xFF;
    write();
}

void TCA9548A::write() {
    myWire->beginTransmission(_address);
    myWire->write(_channels);
    myWire->endTransmission(true);
}
