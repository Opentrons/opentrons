#include "SparkFun_TMF882X_Library.h"
#include "SPADMAP.h"
#include "CAL.h"

#define N_SAMPLES  1
#define MAX_BIN_LEN 128

SparkFun_TMF882X  myTMF882X;

int zone = 0;

char terminator = '\n';
String m_start = "TOF$";
String message, command;

void onHistogramCallback(struct tmf882x_msg_histogram *myHistogram) {

  uint8_t zone_count = zone;
  int tdc_idx = int(zone/2);
  Serial.print((String)"#HLONG-"+(zone_count)+":");

  if (zone % 2) {
    // Odd: The second channel occupies bins [TMF882X_HIST_NUM_BINS/2 : TMF882X_HIST_NUM_BINS]
    for (int bin_idx = TMF882X_HIST_NUM_BINS/2; bin_idx < TMF882X_HIST_NUM_BINS; ++bin_idx) {
      Serial.print((unsigned long)myHistogram->bins[tdc_idx][bin_idx]);
      if ((bin_idx + 1) % MAX_BIN_LEN != 0) {
        Serial.print(",");
      }
    }
  }
  else {
    // Even: The first channel occupies bins [0 : TMF882X_HIST_NUM_BINS/2]
    for (int bin_idx = 0; bin_idx < TMF882X_HIST_NUM_BINS/2; ++bin_idx) {
      Serial.print((unsigned long)myHistogram->bins[tdc_idx][bin_idx]);
      if ((bin_idx + 1) % MAX_BIN_LEN != 0) {
        Serial.print(",");
      }
    }
  }
  Serial.print("\n");
}

void setup() {
  delay(500);
  Serial.begin(115200);

  if(!myTMF882X.begin()){
    Serial.println("Error - The TMF882X failed to initialize - is the board connected?");
    while(1){}
  }

  myTMF882X.setHistogramHandler(onHistogramCallback);
  myTMF882X.setSampleDelay(1000);

  struct tmf882x_mode_app_config tofConfig;
  if (!myTMF882X.getTMF882XConfig(tofConfig)) {
    Serial.println("Error - unable to get device configuration.");
    while(1){}
  }

  tofConfig.report_period_ms = 500;
  tofConfig.histogram_dump = 1;
  tofConfig.kilo_iterations = 4000;
  tofConfig.spad_map_id = 14;

  if (!myTMF882X.setTMF882XConfig(tofConfig)) {
    Serial.println("Error - unable to set device configuration.");
    while(1){}
  }

  if (!myTMF882X.setSPADConfig(spadConfig)) {
    Serial.println("Error - Setting SPAD config failed.");
    while (1) {}
  }

  //Setting short range high accuracy mode
  uint8_t range_status = myTMF882X.getActiveRange();
  Serial.println(range_status);
  range_status = myTMF882X.setActiveRange(0x6F);
  Serial.println(range_status);

  //Set the calibration
  if (!myTMF882X.setCalibration(cal_data)) {
    Serial.println("Error - Calibration Load Failed.");
    while (1) {}
  }
}

void loop() {
  if (Serial.available() > 0) {
    message = Serial.readStringUntil(terminator);
    if (message.startsWith(m_start)) {
      command = message.substring(0, message.indexOf(','));
      if(command.indexOf("HZ") > 0){
        zone = message.substring(message.indexOf(',')+1).toInt();
        myTMF882X.startMeasuring(N_SAMPLES);
      }
    }
  }
}
