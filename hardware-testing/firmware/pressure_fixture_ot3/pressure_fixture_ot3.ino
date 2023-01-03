#include <Arduino.h>
#include <Wire.h>

#include "MMR920C04.h"
#include "TCA9548A.h"

#define FW_VERSION_STRING ("0.0.0")

#define NUM_CHANNELS (8)
#define PRINT_ALL_CHANNELS (0xF)

float pressure[NUM_CHANNELS] = {0.0};
MMR920C04 Pressure();

#define TCA9548A_PIN_RESET (22)
#define TCA9548A_PIN_ADDR0 (24)
#define TCA9548A_PIN_ADDR1 (23)
#define TCA9548A_PIN_ADDR2 (25)
TCA9548A I2CMux(TCA9548A_PIN_RESET, TCA9548A_PIN_ADDR0, TCA9548A_PIN_ADDR1, TCA9548A_PIN_ADDR2);


float sensor_conv_pressure(uint8_t *result) {
    int32_t data;
    float convData;
    data = (int32_t)result[2];
    data += (int32_t)result[1] * 256;
    data += (int32_t)result[0] * 256 * 256;
    data <<= 8;
    data >>= 8;
    convData = (float)data / pow(10, 5);
    convData = convData / 10.1972; // convert from cmH20 to kPa
    return convData;
}

float read_pressure(uint8_t channel) {
    I2CMux.openChannel(channel);
    delay(5);
    Pressure.writeReg(0x94);  // TODO: what does this do?
    Pressure.writeReg(0xA0);  // TODO: what does this do?
    delay(20);
    Pressure.writeReg(0xC4);  // TODO: what does this do?
    uint8_t dataTemp[3] = {0, 0, 0};
    Pressure.readReg(dataTemp, 3);
    delay(5);
    I2CMux.closeChannel(PressureChannel);
    delay(5);
    return sensor_conv_pressure(dataTemp);
}

void print_pressure_data(int channel) {
    if(channel > 0 && channel <= NUM_CHANNELS) {
        Serial.println(read_pressure(tempData));
    }
    else if(channel == PRINT_ALL_CHANNELS) {
        for(int i = 0; i < NUM_CHANNELS; i++) {
            Serial.print(read_pressure(i));
            if (i < NUM_CHANNELS - 1) {
                Serial.print(",");
            }
        }
        Serial.println();
    }
    else {
        Serial.println("Unexpected command");
    }
}

void setup() {
    Serial.begin(115200);
    Serial.setTimeout(100); // milliseconds to wait for entire data packet
    I2CMux.begin(Wire);
    I2CMux.closeAll();
    for (uint8_t i = 0; i < NUM_CHANNELS; i++) {
        I2CMux.openChannel(i);
        Pressure.reset();
        I2CMux.closeChannel(i);
    }
}

void loop() {
    if (Serial.available()) {
        char c = Serial.read();
        if (c == 'p' or c == 'P') {
            int channel = Serial.parseInt();
            if (channel > 0) {
                print_pressure_data(channel);
            }
            else {
                Serial.println("Unexpected command");
            }
        }
        else if (c == 'v' or c == 'V') {
            Serial.println(FW_VERSION_STRING)
        }
        else {
            Serial.println("Unexpected command");
        }
        delay(1);
        while (Serial.available()) {
            c = Serial.read();
            if (c == '\n') {
                break;
            }
            delay(1);
        }
    }
}
