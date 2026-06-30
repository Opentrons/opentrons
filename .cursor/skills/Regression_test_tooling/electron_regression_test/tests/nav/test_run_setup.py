pass
'''
We're going to need the following: 
And if statement divided into configured and unconfigured runs 

if run unconfigured:
    nav setup
    get_by_text("Instruments attached")
    screenshot("Instruments attached but not calibrated")
    get_by_text("calibrate")
    then continue through (always have the probe attached)
    get_by_text("Deck Hardware")
    screenshot("Deck Hardware not set up yet")
    Then calibrate each of the hardware items 
    screenshot("Deck Hardware set up")
    Select "Proceed to labware offsets"
    select "Run Labware Position Check" 
else: 
    get_by_text("Instruments attached")
    screenshot("Instruments attached and calibrated")
    get_by_text("Deck Hardware")
    screenshot("Deck Hardware set up")
    get_by_text("Apply offsets") 
    Labware & Liquids 
    screenshot("Labware & Liquids")
    Camera  
    screenshot("Camera")
    select_by_text("Confirm preferences")
    "back to top"





screenshot("Instruments attached")
get_by_text("Instruments attached")

'''