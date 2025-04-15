// (sigler) this was made for an Arduino Uno and a Power Relay Module
//         https://www.adafruit.com/product/2935

#define PIN_OUTLET (12)
#define PIN_STATE_ON (HIGH)
#define PIN_STATE_OFF (LOW)
#define ON_TIME_MS (1000)

#define PIN_INPUT_PULL_UP (8)
#define PIN_INPUT_GND (9)
#define BUTTON_STATE_PRESSED (LOW)
#define BUTTON_STATE_UNPRESSED (HIGH)
#define BUTTON_UPDATE_MS (20)

String TRIGGER = "enable";
uint8_t trigger_idx = 0;
unsigned long triggered_timestamp = 0;
uint8_t button_state = BUTTON_STATE_UNPRESSED;
unsigned long button_timestamp = 0;

bool is_enabled() {
  unsigned long now = millis();
  if (now < ON_TIME_MS) {
    return false;
  }
  return (now - triggered_timestamp < ON_TIME_MS);
}

bool button_loop() {
    uint8_t new_button_state = digitalRead(PIN_INPUT_PULL_UP);
    uint8_t prev_button_state = button_state;
    button_state = new_button_state;
    if (new_button_state == BUTTON_STATE_UNPRESSED || prev_button_state == BUTTON_STATE_PRESSED) {
        return false;
    }
    unsigned long now = millis();
    unsigned long time_diff = (now - button_timestamp);
    button_timestamp = now;
    if (time_diff < BUTTON_UPDATE_MS) {
        return false;
    }
    return true;
}

bool serial_loop() {
  if (!Serial.available()) {
    return false;
  }
  char c = Serial.read();
  if (c == '?') {
    if (is_enabled()) {
      Serial.println("on");
    } else {
      Serial.println("off");
    }
  }
  else if (c == TRIGGER[trigger_idx]) {
    trigger_idx += 1;
  } else {
    trigger_idx = 0;
  }
  if (trigger_idx == TRIGGER.length()) {
    trigger_idx = 0;
    while (Serial.available()) {
      Serial.read();
      delay(2);
    }
    return true;
  } else {
    return false;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_OUTLET, OUTPUT);  // red LEDs
  pinMode(PIN_INPUT_PULL_UP, INPUT_PULLUP);  // momentary button, pressing drops pin to LOW
  pinMode(PIN_INPUT_GND, OUTPUT);
  digitalWrite(PIN_INPUT_GND, LOW);
}

void loop() {
  bool serial_trigger = serial_loop();  // run each loop
  bool button_trigger = button_loop();  // run each loop
  if (is_enabled()) {
    return;  // ignore triggers while enabled
  }
  if (serial_trigger || button_trigger) {
    digitalWrite(PIN_OUTLET, PIN_STATE_ON);  // enable
    triggered_timestamp = millis();
  }
  else {
    digitalWrite(PIN_OUTLET, PIN_STATE_OFF);  // disable
  }
}
