#!/bin/bash
python cli.py run \
 --text-mode Concise \
 --left-pipette '{"model": "p20_single_v2.0", "id": "P20SV202020070101"}' \
 $HOME/Documents/repos/opentrons/api/tests/opentrons/data/g_code_validation_protocols/smoothie_protocol.py