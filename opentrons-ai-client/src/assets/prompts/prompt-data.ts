export const reagentTransfer = `
Write a protocol using the Opentrons Python Protocol API v2 for OT-2 robot according to the following description:
  
Labware:
- Source Labware: \`Thermo Scientific Nunc 96 Well Plate 1300 uL\` in slot 9
- Destination Labware: \`Opentrons 96 Flat Bottom Adapter with NEST 96 Well Plate 200 uL Flat\` in slot 10
- \`Opentrons 96 Filter Tip Rack 1000 uL\` in slot 8
- \`Opentrons 96 Tip Rack 1000 uL\` in slot 3

Pipette mount:
- P1000 Single-Channel GEN2 is mounted on the left
- P1000 Single-Channel GEN2 is mounted on the right

Commands:
1. Use the left-mounted P1000 Single-Channel GEN2 pipette to transfer 196 uL of reagent from wells A7, A6, A5, A2, A3 
of the source labware to the corresponding wells A5, A9, A1, A10, A2 of the destination labware. Use a new tip for each transfer.
2. Use the right-mounted P1000 Single-Channel GEN2 pipette to transfer 8 uL of liquid from wells A9, A12, A6, A10, A3 
of the source labware to the corresponding wells A7, A11, A6, A3, A9 of the destination labware. Use the same tip for all transfers.
`

export const flexReagentTransfer = `
Write a protocol using the Opentrons Python Protocol API v2 for Flex robot according to the following description: 
  
Labware:
- Source Labware: \`Opentrons 96 PCR Heater-Shaker Adapter with NEST Well Plate 100 ul\`, in slot D1
- Destination Labware: \`Opentrons 96 Well Aluminum Block with Bio-Rad Well Plate 200 uL\`, in slot C2
- Tiprack: \`Opentrons Flex 96 Filter Tip Rack 1000 uL\`,  in slot C1

Pipette Mount:
- Flex 1-Channel 1000 uL Pipette is mounted on the left side

Commands:
1. Using Flex 1-Channel 1000 uL Pipette on left mount, transfer 117.0 uL  of reagent from the first well in source labware 
to E12, G12, B9, A6, D7 wells in the destination labware. Use a new tip for each transfer.
`

export const pcr = `
Write a protocol using the Opentrons Python Protocol API v2 for the OT-2 robot according to the following description:
      
Modules:
- The thermocycler module is located in slot 7.
- The sample temperature module is positioned in slot 1.
- The mastermix temperature module is positioned in slot 3.

Labware:
- The source sample labware, an Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt, is placed on the temperature module in slot 1.
- The source mastermix labware, an Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt, is placed on the temperature module in slot 3.
- The destination labware, an Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt, is placed on the thermocycler module in slot 7.
- A 20 uL filter tip rack is used in slot 4.

Pipette Mount:
- A P20 Multi-Channel Gen2 pipette is mounted on the left side.

Well Allocation:
- Sample source wells: the first 64 wells column-wise in the sample source plate.
- Mastermix source wells: the first 64 wells column-wise in the mastermix plate.
- Destination wells: the first 64 wells column-wise in the thermocycler.

Commands:
1. Set the total number of samples to 64.
2. Open the thermocycler lid.
3. Set the thermocycler block temperature to 6C.
4. Set the thermocycler lid temperature to 55C.
5. Set the sample temperature module to 4C.
6. Set the mastermix temperature module to 10C.
7. Transfer 7 uL of mastermix from the mastermix source wells to the destination wells. Use the same pipette tip for all transfers.
8. Transfer 5 uL of the sample from the source to the destination. Mix the sample and mastermix for a total volume of 12 uL 9 times. 
Blow out to \`destination well\` after each transfer. Use a new tip for each transfer.
9. Close the thermocycler lid.
10. Execute the thermocycler with the following profile:
    - 74C for 65 seconds for 1 cycle, block max volume is sample and mastermix volume
11. Execute the thermocycler with the following profile:
    - 60C for 7 seconds, 84C for 19 seconds, 57C for 44 seconds for 13 cycles,  block max volume is sample and mastermix volume
12. Execute the thermocycler with the following profile:
    - 75C for 480 seconds for 1 cycle,  block max volume is sample and mastermix volume
13. Hold the thermocycler block at 4C.
14. Open the thermocycler lid.
15. Deactivate the mastermix temperature module.
16. Deactivate the sample temperature module.
`

export const flexPcr = `
Write a protocol using the Opentrons Python Protocol API v2 for Flex robot according to the following description:
      
Modules:
- Thermocycler module GEN 2
- Sample temperature module GEN 2 is placed in slot D1
- Mastermix temperature module GEN 2 is placed in slot D3

Adapter:
- Opentrons 96 Well Aluminum Block adapter is placed on the sample temperature module GEN 2
- Opentrons 96 Well Aluminum Block adapter is placed on the mastermix temperature module GEN 2

Labware:
- Source sample labware is Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt placed on the adapter on the sample temperature module in slot 1
- Source mastermix labware is Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt placed on the adapter on the mastermix temperature module in slot 3
- Destination Labware is an Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt placed on thermocycler module in slot 7
- Opentrons Flex 96 Filter Tip Rack 1000 uL is used in slot C1
- Opentrons Flex 96 Filter Tip Rack 50 uL is used in slot C2

Pipette mount:
- Flex 8-Channel 1000 uL Pipette is mounted on the left side
- Flex 8-channel 50 ul pipette is mounted on the right side

Well allocation:
- mastermix source wells: the first 9 columns in the mastermix plate
- sample source wells: the first 9 columns of the sample plate
- destination wells: first 9 columns on thermocycler

Commands:
1. Set the total number of samples to 72.
2. Set the thermocycler block temperature to 6 degree C.
3. Set the thermocycler lid temperature to 55 degree C.
4. Open the thermocycler lid.
5. Set the sample temperature module to 37 degree C.
6. Set the master mix temperature module to 10 C.
7. Use right pipette to transfer 15 uL of mastermix from source well to destination well. Use the same pipette tip for all transfers.
8. Use left pipette to transfer 10 ul of sample from the source to destination well. Mix the sample and mastermix of
25 ul total volume 9 times. Blow out to \`destination well\`. Use a new tip for each transfer.
9. Close the thermocycler lid.
10. Execute the thermocycle with the following profile:
   - 74 degree C for 65 seconds for 1 cycle, block max volume is sample and mastermix volume
11. Execute the thermocycle with the following profile:
   - 60 degree C for 7 seconds, 84 degree C for 19 seconds, 57 degree C for 44 seconds for 25 cycles, block max volume is sample and mastermix volume
12. Execute the thermocycle with the following profile:
   - 75 degree C for 480 seconds for 1 cycle, block max volume is sample and mastermix volume
13. Hold thermocycler block at 4 C.
14. Open thermocycler lid.
15. Deactivate the master mix temperature module.
16. Deactivate the sample temperature module.
`
