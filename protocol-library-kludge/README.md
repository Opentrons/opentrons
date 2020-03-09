# Protocol Library Kludge

This app provides an OT2 deck map component intended to be used in an iframe in Protocol Library.

JSON data to set up labware and modules is passed in through the `data` URL param.

# Example URL Params

## Standard labware + magnetic module

http://localhost:8080/?data=%7B%22labware%22:%7B%221%22:%7B%22labwareType%22:%22biorad_96_wellplate_200ul_pcr%22,%22name%22:%22Bio-Rad%2096%20Well%20Plate%20200%20%C2%B5L%20PCR%20on%20Magnetic%20Module%20on%201%22%7D,%222%22:%7B%22labwareType%22:%22biorad_96_wellplate_200ul_pcr%22,%22name%22:%22output%20plate%20on%202%22%7D,%223%22:%7B%22labwareType%22:%22opentrons_96_tiprack_1000ul%22,%22name%22:%22p1000%20tiprack%20on%203%22%7D,%225%22:%7B%22labwareType%22:%22opentrons_96_tiprack_1000ul%22,%22name%22:%22p1000%20tiprack%20on%205%22%7D,%227%22:%7B%22labwareType%22:%22usascientific_12_reservoir_22ml%22,%22name%22:%22reagent%20reservoir%20on%207%22%7D,%2212%22:%7B%22labwareType%22:%22opentrons_1_trash_1100ml_fixed%22,%22name%22:%22Opentrons%20Fixed%20Trash%20on%2012%22%7D%7D,%22modules%22%3A%7B%221%22%3A%20%22magneticModuleV1%22%7D%7D

## Custom labware

http://localhost:8080/?data=%7B%22labware%22:%7B%221%22:%7B%22labwareType%22:%22generic_96_tiprack_20ul%22,%22name%22:%22Custom%20200%C2%B5L%20Tiprack%20on%201%22%7D,%222%22:%7B%22labwareType%22:%22generic_96_tiprack_200ul%22,%22name%22:%22Custom%20200%C2%B5L%20Tiprack%20on%202%22%7D,%223%22:%7B%22labwareType%22:%22custom_96_tubeholder_500ul%22,%22name%22:%22Custom%20500ul%20Tube%20Holder%20on%203%22%7D,%2212%22:%7B%22labwareType%22:%22opentrons_1_trash_1100ml_fixed%22,%22name%22:%22Opentrons%20Fixed%20Trash%20on%2012%22%7D%7D,%22modules%22:%7B%7D%7D
