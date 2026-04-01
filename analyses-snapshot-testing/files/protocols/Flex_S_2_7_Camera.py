from opentrons.protocol_api import ProtocolContext

metadata = {
    "protocolName": "Camera Test (PAPI 2.27)",
    "author": "QA",
    "description": "Comprehensive test of the capture_image method with varying parameters.",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.27",
}

def run(protocol: ProtocolContext) -> None:
    # -------------------------------------------------------------------------
    # SETUP
    # -------------------------------------------------------------------------
    protocol.comment("---------------------------------------------------------")
    protocol.comment("INITIALIZING PROTOCOL AND HARDWARE")
    protocol.comment("---------------------------------------------------------")
    
    # We load a pipette solely to move the gantry (and camera) to specific locations
    protocol.comment("Loading Flex 1-Channel Pipette on Mount Left...")
    pipette = protocol.load_instrument("flex_1channel_50", "left")
    
    # Loading a trash bin to give the deck some geometry
    protocol.comment("Loading Trash Bin on Slot A3...")
    protocol.load_trash_bin("A3")

    # -------------------------------------------------------------------------
    # TEST 1: DEFAULT CAPTURE
    # -------------------------------------------------------------------------
    protocol.comment("---------------------------------------------------------")
    protocol.comment("TEST 1: DEFAULT PARAMETERS")
    protocol.comment("---------------------------------------------------------")
    protocol.comment("Explanation: Testing capture_image with no arguments.")
    
    # Move to a central location first

    
    protocol.comment("ACTION: Capturing image (default settings)...")
    # Using the method found in your JSON source: ProtocolContext.capture_image
    protocol.capture_image(filename="test_1_default")
    protocol.comment("CONFIRMATION: Image 'test_1_default' capture command sent.")

    # -------------------------------------------------------------------------
    # TEST 2: ZOOM FUNCTIONALITY
    # -------------------------------------------------------------------------
    protocol.comment("---------------------------------------------------------")
    protocol.comment("TEST 2: DIGITAL ZOOM")
    protocol.comment("---------------------------------------------------------")
    protocol.comment("Explanation: Testing the 'zoom' argument.")
    
    zoom_level = 2.0
    protocol.comment(f"ACTION: Capturing image with {zoom_level}x zoom...")
    
    protocol.capture_image(
        filename="test_2_zoom_2x",
        zoom=zoom_level
    )
    protocol.comment("CONFIRMATION: Image 'test_2_zoom_2x' capture command sent.")

    # -------------------------------------------------------------------------
    # TEST 3: IMAGE PROCESSING (Contrast, Brightness, Saturation)
    # -------------------------------------------------------------------------
    protocol.comment("---------------------------------------------------------")
    protocol.comment("TEST 3: IMAGE PROCESSING PARAMS")
    protocol.comment("---------------------------------------------------------")
    protocol.comment("Explanation: Testing contrast, brightness, and saturation args.")
    
    # Values are arbitrary for testing API acceptance
    test_contrast = 2.0
    test_brightness = 0.5
    test_saturation = 1.5
    
    protocol.comment(f"Configuring: Contrast={test_contrast}, Brightness={test_brightness}, Saturation={test_saturation}")
    protocol.comment("ACTION: Capturing processed image...")
    
    protocol.capture_image(
        filename="test_3_processed",
        contrast=test_contrast,
        brightness=test_brightness,
        saturation=test_saturation
    )
    protocol.comment("CONFIRMATION: Image 'test_3_processed' capture command sent.")

    # -------------------------------------------------------------------------
    # TEST 4: HOME BEFORE CAPTURE
    # -------------------------------------------------------------------------
    protocol.comment("---------------------------------------------------------")
    protocol.comment("TEST 4: HOME BEFORE CAPTURE")
    protocol.comment("---------------------------------------------------------")
    protocol.comment("Explanation: Testing the 'home_before' boolean argument.")
    
    protocol.comment("Moving gantry to a random position (Slot D1) to ensure homing is visible...")

    
    protocol.comment("ACTION: Capturing image with home_before=True...")
    # This should trigger a gantry home before the shutter snaps
    protocol.capture_image(
        filename="test_4_home_before",
        home_before=True
    )
    protocol.comment("CONFIRMATION: Image 'test_4_home_before' capture command sent.")

    # -------------------------------------------------------------------------
    # COMPLETION
    # -------------------------------------------------------------------------
    protocol.comment("---------------------------------------------------------")
    protocol.comment("TEST COMPLETE")
    protocol.comment("---------------------------------------------------------")
    protocol.comment("Please check the robot run logs or data directory for output images.")