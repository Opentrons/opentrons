import json
import uuid
from typing import Any, Dict, Iterable

import requests
import structlog
from ddtrace import tracer
from openai.types.chat import ChatCompletionToolParam

from api.settings import Settings

settings: Settings = Settings()
logger = structlog.stdlib.get_logger(settings.logger_name)


def generate_unique_name() -> str:
    unique_name = str(uuid.uuid4()) + ".py"
    return unique_name


@tracer.wrap()
def send_post_request(payload: str) -> str:
    url = "https://Opentrons-simulator.hf.space/protocol"
    protocol_name: str = generate_unique_name()
    data = {"name": protocol_name, "content": payload}
    hf_token: str = settings.huggingface_api_key.get_secret_value()
    headers = {"Content-Type": "application/json", "Authorization": "Bearer {}".format(hf_token)}
    logger.info("Sending POST request to the simulate API", extra={"url": url, "protocolName": data["name"]})
    response = requests.post(url, json=data, headers=headers)

    if response.status_code != 200:
        logger.error("Error: " + response.text)
        return "Error: " + response.text

    # Check the response before returning it
    # ToDo clean up code
    response_data: Dict[str, Any] = response.json()
    if "error_message" in response_data:
        logger.error("Error in response:", response_data["error_message"])
        return str(response_data["error_message"])
    elif "protocol_name" in response_data:
        logger.debug("Protocol executed successfully", extra={"response_data": response_data["run_log"]})

        return str(response_data["run_status"])
        # ToDo if run_log option is on
        # return response_data["run_log"]
    else:
        logger.info("Unexpected response:", extra={"response_data": response_data})
        return "Unexpected response"


def simulate_protocol(protocol: str) -> str:
    response: str = send_post_request(protocol)
    return response


available_functions: Dict[str, Any] = {
    "simulate_protocol": simulate_protocol,
}


tools: Iterable[ChatCompletionToolParam] = [
    {
        "type": "function",
        "function": {
            "name": "simulate_protocol",
            "description": "Simulate the python protocol",
            "parameters": {
                "type": "object",
                "properties": {
                    "protocol": {
                        "type": "string",
                        "description": "the python protocol in string format",
                    }
                },
                "required": ["protocol"],
            },
        },
    }
]


def execute_function_call(function_name: str, arguments: str) -> str:
    function = available_functions.get(function_name, None)
    if function:
        _arguments: Dict[str, Any] = json.loads(arguments)
        result = function(**_arguments)
        if isinstance(result, str):
            return result
        else:
            return str(result)
    else:
        return f"Error: function {function_name} does not exist"


system_notes = """\
You are an expert at generating a protocol based on Opentrons Python API v2.
You will be shown the user's question/description and information related to
the Opentrons Python API v2 documentation. And you respond the user's question/description
using only this information.

INSTRUCTIONS:

1) All types of protocols are based on apiLevel 2.19,
 thus prepend the following code block
`metadata` and `requirements`:
```python
from opentrons import protocol_api

metadata = {
    'protocolName': '[protocol name by user]',
    'author': '[user name]',
    'description': "[what is the protocol about]"
}
requirements = {"robotType": "[Robot type]", "apiLevel": "2.19"}
```

2) See the transfer rules <<COMMON RULES for TRANSFER>> below.
3) Learn examples see <<EXAMPLES>>

4) Inside `run`  function, according to the description generate the following in order:
- modules
- adapter
- labware
- pipettes
Note that sometimes API names is very long eg.,
`Opentrons 96 Flat Bottom Adapter with NEST 96 Well Plate 200 uL Flat`


5)  If the pipette is multi-channel eg., P20 Multi-Channel Gen2, please use `columns` method.

6) <<< Load trash for Flex >>>
For Flex protocols, NOT OT-2 protocols using API version 2.16 or later,
load a trash bin in slot A3:
```python
trash = protocol.load_trash_bin("A3")
```
Note that you load trash before commands.
\n\n
"""

standard_labware_api = """

<Standard API>

### Approved Pipette Loadnames
Note that the labware names are hard to differenciate sometimes,
since there are caes that they differ in terms of last digits only.

#### OT-2 Approved Loadnames
For OT-2 robots, use the following approved loadnames:
- p20_single_gen2
- p300_single_gen2
- p1000_single_gen2
- p300_multi_gen2
- p20_multi_gen2

#### Flex Approved Loadnames
For Flex robots, use these approved loadnames:
- flex_1channel_50
- flex_1channel_1000
- flex_8channel_50
- flex_8channel_1000
- flex_96channel_1000


### Agilent Labware
- Agilent 1 Well Reservoir 290 mL: agilent_1_reservoir_290ml

### Applied Biosystems Labware
- Applied Biosystems MicroAmp 384 Well Plate 40 uL: appliedbiosystemsmicroamp_384_wellplate_40ul

### Axygen Labware
- Axygen 1 Well Reservoir 90 mL: axygen_1_reservoir_90ml

### Bio-Rad Labware
- Bio-Rad 384 Well Plate 50 uL: biorad_384_wellplate_50ul
- Bio-Rad 96 Well Plate 200 uL PCR: biorad_96_wellplate_200ul_pcr

### Corning Labware
- Corning 12 Well Plate 6.9 mL Flat: corning_12_wellplate_6.9ml_flat
- Corning 24 Well Plate 3.4 mL Flat: corning_24_wellplate_3.4ml_flat
- Corning 384 Well Plate 112 uL Flat: corning_384_wellplate_112ul_flat
- Corning 48 Well Plate 1.6 mL Flat: corning_48_wellplate_1.6ml_flat
- Corning 6 Well Plate 16.8 mL Flat: corning_6_wellplate_16.8ml_flat
- Corning 96 Well Plate 360 uL Flat: corning_96_wellplate_360ul_flat

### GEB Labware
- GEB 96 Tip Rack 1000 uL: geb_96_tiprack_1000ul
- GEB 96 Tip Rack 10 uL: geb_96_tiprack_10ul

### NEST Labware
- NEST 12 Well Reservoir 15 mL: nest_12_reservoir_15ml
- NEST 1 Well Reservoir 195 mL: nest_1_reservoir_195ml
- NEST 1 Well Reservoir 290 mL: nest_1_reservoir_290ml
- NEST 96 Well Plate 100 uL PCR Full Skirt: nest_96_wellplate_100ul_pcr_full_skirt
- NEST 96 Well Plate 200 uL Flat: nest_96_wellplate_200ul_flat
- NEST 96 Deep Well Plate 2mL: nest_96_wellplate_2ml_deep


### Opentrons Labware
- Opentrons 10 Tube Rack with Falcon 4x50 mL, 6x15 mL Conical: opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical
- Opentrons 10 Tube Rack with NEST 4x50 mL, 6x15 mL Conical: opentrons_10_tuberack_nest_4x50ml_6x15ml_conical
- Opentrons 15 Tube Rack with Falcon 15 mL Conical: opentrons_15_tuberack_falcon_15ml_conical
- Opentrons 15 Tube Rack with NEST 15 mL Conical: opentrons_15_tuberack_nest_15ml_conical
- Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap: opentrons_24_aluminumblock_generic_2ml_screwcap
- Opentrons 24 Well Aluminum Block with NEST 0.5 mL Screwcap: opentrons_24_aluminumblock_nest_0.5ml_screwcap
- Opentrons 24 Well Aluminum Block with NEST 1.5 mL Screwcap: opentrons_24_aluminumblock_nest_1.5ml_screwcap
- Opentrons 24 Well Aluminum Block with NEST 1.5 mL Snapcap: opentrons_24_aluminumblock_nest_1.5ml_snapcap
- Opentrons 24 Well Aluminum Block with NEST 2 mL Screwcap: opentrons_24_aluminumblock_nest_2ml_screwcap
- Opentrons 24 Well Aluminum Block with NEST 2 mL Snapcap: opentrons_24_aluminumblock_nest_2ml_snapcap
- Opentrons 24 Tube Rack with Eppendorf 1.5 mL Safe-Lock Snapcap: opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap
- Opentrons 24 Tube Rack with Eppendorf 2 mL Safe-Lock Snapcap: opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap
- Opentrons 24 Tube Rack with Generic 2 mL Screwcap: opentrons_24_tuberack_generic_2ml_screwcap
- Opentrons 24 Tube Rack with NEST 0.5 mL Screwcap: opentrons_24_tuberack_nest_0.5ml_screwcap #not opentrons_24_tuberack_nest_0_5ml_screwcap
- Opentrons 24 Tube Rack with NEST 1.5 mL Screwcap: opentrons_24_tuberack_nest_1.5ml_screwcap #not opentrons_24_tuberack_nest_1_5ml_screwcap
- Opentrons 24 Tube Rack with NEST 1.5 mL Snapcap: opentrons_24_tuberack_nest_1.5ml_snapcap
  # note the use of dot. (`.`); opentrons_24_tuberack_nest_1_5ml_snapcap is incorrect
- Opentrons 24 Tube Rack with NEST 2 mL Screwcap: opentrons_24_tuberack_nest_2ml_screwcap
- Opentrons 24 Tube Rack with NEST 2 mL Snapcap: opentrons_24_tuberack_nest_2ml_snapcap
- Opentrons 6 Tube Rack with Falcon 50 mL Conical: opentrons_6_tuberack_falcon_50ml_conical
- Opentrons 6 Tube Rack with NEST 50 mL Conical: opentrons_6_tuberack_nest_50ml_conical
- Opentrons 96 Well Aluminum Block with Bio-Rad Well Plate 200 uL: opentrons_96_aluminumblock_biorad_wellplate_200ul
- Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 uL: opentrons_96_aluminumblock_generic_pcr_strip_200ul
- Opentrons 96 Well Aluminum Block with NEST Well Plate 100 uL: opentrons_96_aluminumblock_nest_wellplate_100ul
- Opentrons 96 Deep Well Heater-Shaker Adapter: opentrons_96_deep_well_adapter
- Opentrons 96 Deep Well Heater-Shaker Adapter with NEST Deep Well Plate 2 mL: opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep
- Opentrons OT-2 96 Filter Tip Rack 1000 uL: opentrons_96_filtertiprack_1000ul
- Opentrons OT-2 96 Filter Tip Rack 10 uL: opentrons_96_filtertiprack_10ul
- Opentrons OT-2 96 Filter Tip Rack 200 uL: opentrons_96_filtertiprack_200ul
- Opentrons OT-2 96 Filter Tip Rack 20 uL: opentrons_96_filtertiprack_20ul
- Opentrons 96 Flat Bottom Heater-Shaker Adapter: opentrons_96_flat_bottom_adapter
- Opentrons 96 Flat Bottom Heater-Shaker Adapter with NEST 96 Well Plate 200 uL Flat:
  opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat
- Opentrons 96 PCR Heater-Shaker Adapter: opentrons_96_pcr_adapter
- Opentrons 96 PCR Heater-Shaker Adapter with NEST Well Plate 100 ul: opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt
- Opentrons OT-2 96 Tip Rack 1000 uL: opentrons_96_tiprack_1000ul
- Opentrons OT-2 96 Tip Rack 10 uL: opentrons_96_tiprack_10ul
- Opentrons OT-2 96 Tip Rack 20 uL: opentrons_96_tiprack_20ul
- Opentrons OT-2 96 Tip Rack 300 uL: opentrons_96_tiprack_300ul
- Opentrons 96 Well Aluminum Block: opentrons_96_well_aluminum_block
- Opentrons 96 Well Aluminum Block adapter: opentrons_96_well_aluminum_block
- Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt: opentrons_96_wellplate_200ul_pcr_full_skirt
- Opentrons Aluminum Flat Bottom Plate: opentrons_aluminum_flat_bottom_plate
- Opentrons Flex 96 Filter Tip Rack 1000 uL: opentrons_flex_96_filtertiprack_1000ul
- Opentrons Flex 96 Filter Tip Rack 200 uL: opentrons_flex_96_filtertiprack_200ul #
- Opentrons Flex 96 Filter Tip Rack 50 uL: opentrons_flex_96_filtertiprack_50ul
- Opentrons Flex 96 Tip Rack 1000 uL: opentrons_flex_96_tiprack_1000ul
- Opentrons Flex 96 Tip Rack 200 uL: opentrons_flex_96_tiprack_200ul
- Opentrons Flex 96 Tip Rack 50 uL: opentrons_flex_96_tiprack_50ul
- Opentrons Flex 96 Tip Rack Adapter: opentrons_flex_96_tiprack_adapter
- Opentrons Universal Flat Heater-Shaker Adapter: opentrons_universal_flat_adapter
- Opentrons Universal Flat Heater-Shaker Adapter with Corning 384 Well Plate 112 ul Flat: \
    opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat

### Other Labware Brands
- Thermo Scientific Nunc 96 Well Plate 1300 uL: thermoscientificnunc_96_wellplate_1300ul
- Thermo Scientific Nunc 96 Well Plate 2000 uL: thermoscientificnunc_96_wellplate_2000ul
- USA Scientific 12 Well Reservoir 22 mL: usascientific_12_reservoir_22ml
- USA Scientific 96 Deep Well Plate 2.4 mL: usascientific_96_wellplate_2.4ml_deep

### Additional Opentrons Tube Racks
- 4-in-1 Tube Rack Set 15: opentrons_15_tuberack_nest_15ml_conical
- 4-in-1 Tube Rack Set 50: opentrons_6_tuberack_nest_50ml_conical


### Flex Pipettes
- Flex 1-Channel 50 uL Pipette (single channel): flex_1channel_50
- Flex 1-Channel 1000 uL Pipette (single channel): flex_1channel_1000
- Flex 8-Channel 50 uL Pipette (multi-channel): flex_8channel_50
- Flex 8-Channel 1000 uL Pipette (multi-channel): flex_8channel_1000
- Flex 96-Channel 1000 uL Pipette (multi-channel): flex_96channel_1000

### Modules
- temperature module: temperature module gen2
- thermocycler module gen2: thermocyclerModuleV2


</Standard API>
"""

pipette_type = """\n
####
Single channel pipettes:
- Flex 1-Channel 50 uL Pipette
- Flex 1-Channel 1000 uL Pipette
- flex_1channel_1000

####
Multi channel pipettes:
- Flex 8-Channel 50 uL Pipette
- Flex 8-Channel 1000 uL Pipette
- Flex 96-Channel 1000 uL Pipette
"""

example_pcr_1 = """

================= EXAMPLES =================

<<First example>>
<Description>
Write a protocol using the Opentrons Python Protocol API v2 for OT-2 robot for the following description:

Labware:
- Source labware: `Opentrons 24 Tube Rack with NEST 1.5 mL Snapcap` in slot 3
- Destination Labware: `Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt` in slot 9
- `Opentrons OT-2 96 Tip Rack 20 uL` in slot 2

Pipette mount:
- P20 Single Channel is mounted on the right

Commands:
1. Using P20 Single Channel, transfer 1ul of reagent from the first tube of the source rack to each well in the destination plate.
Use the same tip for each transfer.
</Description>

<Protocol>
```python
from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent Transfer',
    'author': 'chatGPT',
    'description': 'Transfer reagent',
}
requirements = {"robotType": "OT-2", "apiLevel": "2.19"}

def run(protocol):
    # labware
    tiprack = protocol.load_labware('opentrons_96_tiprack_20ul', 2)
    source = protocol.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 3)
    destination = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 9)

    # pipettes
    p20s = protocol.load_instrument('p20_single_gen2', mount="right", tip_racks=[tiprack])

    # parameters
    vol = 1
    src_well = source.wells_by_name()['A1']
    dest_wells = destination.wells()

    # commands
    p20s.transfer(vol, src_well, dest_wells, new_tip='once')
```
Note that `transfer` method doesnt use any `for` loop in python.
</Protocol>



<<Second example>>
Using Flex 1-Channel 1000 uL Pipette on left mount, transfer 150 uL from wells A1, A2 in source labware 1
  to B6, B7 in source labware 2. Use the same tip for each transfer.

First collect all wells for source and destination:
```python
source_wells_1 = [source_1.wells_by_name()[wells] for wells in ['A1', 'A2']]
destination_wells_1 = [source_2.wells_by_name()[wells] for wells in ['B6', 'B7']]
```
Then use a transfer method, like so:
```python
p1000s.transfer(150, source_wells_1, destination_wells_1, new_tip="once")
```

Note that we are using a single transfer function for multiple wells.
"""

rules_for_transfer = """

================= COMMON RULES for TRANSFER =================

- when we allocate wells for source and destination, we need to pay attention to pipette type.
For example, see the command below
```
Sample source wells: the first 64 well column-wise in the sample source plate.
```

- <Multi-channel> pipette (eg.,  Flex 8-Channel 1000 uL Pipette), given the number of wells
 we need to estimate the columns and use method `labware.columns()` to access the columns.
 For example,
 ```python
 number_of_columns = math.ceil([number_of_samples] / 8)
 source_wells = labware.columns()[:number_of_columns]
 ```

- <Single or one channel> pipette (eg., Flex 1-Channel 1000 uL Pipette),
we use `labware.wells()`. For example,
```python
source_wells = labware.wells()[:[number_of_samples]]
```
- If prompt says row-wise, we need to use `rows()`
- If prompt does not mention column-wise, we use `wells()` since it is default.
- If the number of samples are not specified, then use all wells.
```python
source_wells = sample_plate.wells()
```
- If `blowout_location` location is mentioned explicitly, then incorporate to transfer method.
- Avoid using `for` with transfer
the following is incorrect:
```python
source_columns = [source_labware.columns_by_name()[str(index)] for index in [3, 2, 5, 1, 10]]
destination_columns = [source_labware.columns_by_name()[str(index)] for index in [4, 8, 1, 9, 2]]

# Transfer reagents
for src, dest in zip(source_columns, destination_columns):
    pipette.transfer(14.0, src, dest, new_tip='always')
```

The correct:
```python
source_columns = [source_labware.columns_by_name()[str(index)] for index in [3, 2, 5, 1, 10]]
destination_columns = [source_labware.columns_by_name()[str(index)] for index in [4, 8, 1, 9, 2]]

# Transfer reagents
pipette.transfer(14.0, source_columns, destination_columns, new_tip='always')
```
"""

general_rules_1 = """
If the input prompt do not contain any python protocol, or general request, then respond based on previous message.

If the input prompt is python protocol for Opentrons robots, do the following as needed:

<instructions>
<first>
1. Check if `transfer` is used inside `for` loop. If it is used, change the code such that
 `for` is removed since transfer method can handle lists implicitly well.

For example, Excerpt-1 and Excerpt-2 shown below are the same in terms of functionality.
But, we want Excerpt-2 over Excerpt-1 since `transfer` method handles lists implicitly.

Excerpt-1
```python
for source_well, destination_well in zip(source_wells, destination_wells):
   pipette.pick_up_tip()
   pipette.transfer(TRANSFER_VOL, source_well, destination_well, new_tip='never')
   pipette.drop_tip()
```

Excerpt-2
```python
pipette.transfer(TRANSFER_VOL, source_wells, destination_wells, new_tip='always')
```
</first>

<second>
2. Note that when command says `Use the same tip for all transfers` or similar.
Do not use new_tip='once' inside `for` loop, because this is not correct:
```python
for src, dest in zip(source_columns, destination_columns):
    pipette.transfer(transfer_vol, src, dest, new_tip='once')
```

Instead, use without `for` loop like so:
```python
pipette.transfer(transfer_vol, source_columns, destination_columns, new_tip='once')
```

Otherwise, return the prompt as it is.
</second>

<third>
3. Do not forget import necessary libraries such as `import math`, when using `ceil` or other methods.
</third>

<fourth>
4.  If the pipette is multi-channel eg., P20 Multi-Channel Gen2, please use `columns` method.
</fourth>

When you respond dont be verbose like reiterating what you have done, just return the python protocol.
</instructions>
"""

prompt_template_str = """\
        Below is a protocol description containing detailed information about the protocol:

        {protocol_description}

        Convert the protocol description to several atomic descriptions. \
        If statements are split by hyphen (-) or numbers (1), then each split can be considered\
        as a single atomic item. Get the statements fully.
        If they are not split or unclear, please decide yourself.
        If a protocol contains metadata and requirements, please ignore them.
        If nothing is provided, return blank.

        Example input:
        ```
        INTRO

        Metadata:
        - M-1
        - M-2
        - M-3

        Requirements:
        - R-1

        Modules
        - M-1

        Adapter
        - A-1

        Labware:
        - L-1
        - L-2
        - L-3

        Pipette mount:
        - P-1

        Well Allocation:
        - wa-11
        - wa-12

        Commands:
        1. C-1
        2. C-2
        ```

        Output:
        ```
        [INTRO, M-1, A-1, L-1, L-2, L-3, P-1, wa-11, wa-12, C-1, C-2]
        ```
        """
