export const reagentTransfer = `
Write a protocol for the Opentrons OT-2 as described below:

Metadata:
- Application: Reagent transfer
- Robot: OT-2
- API: 2.15

Pipette mount:
- P1000 Single-Channel GEN2 is mounted on left
- P300 Single-Channel GEN2 is mounted on right

Labware:
- Source Labware: Thermo Scientific Nunc 96 Well Plate 2000 µL on slot 7
- Destination Labware: Opentrons 24 Well Aluminum Block with NEST 0.5 mL Screwcap on slot 3
- Tiprack: Opentrons 96 Filter Tip Rack 1000 µL on slot 4

Commands:
- Using P1000 Single-Channel GEN2 pipette on left mount, transfer 195.0 uL of reagent
  from H10, F12, D7, B1, C8  wells in source labware
  to first well in the destination labware.
  Use  new tip for each transfer.
`

export const flexReagentTransfer = `
Write a protocol for the Opentrons Flex as described below: 

Metadata and requirements:
- Application: Reagent transfer
- Robot: Flex
- API: 2.15

Pipette Mount:
- Flex 1-Channel 1000 µL Pipette is mounted on the left side
- Flex 1-Channel 50 µL Pipette is mounted on the right side

Labware:
- Source Labware 1: NEST 1 Well Reservoir 195 mL  is positioned on slot B1
- Source Labware 2: Bio-Rad 384 Well Plate 50 µL is positioned on slot B2
- Source Labware 3: Bio-Rad 96 Well Plate 200 µL is positioned on slot B3
- Destination Labware 1: Corning 384 Well Plate 112 µL Flat is positioned on slot D1
- Destination Labware 2: Corning 96 Well Plate 360 µL Flat is positioned on slot D2
- Tiprack 1: Opentrons Flex 96 Filter Tip Rack 200 µL is used on slot A1
- Tiprack 2: Opentrons Flex 96 Filter Tip Rack 50 µL is used on slot A2

Commands
- Using Flex 1-Channel 50 µL Pipette on right mount, transfer 15 µL from first of source labware 1 to each well
  in destination labware 1 and destination labware 2. Reuse the same tip.
- Again using Flex 1-Channel 50 µL Pipette, transfer 20 µL from each well in source labware 2 to
  each well in the destination labware 1. Reuse the same tip.
- Using Flex 1-Channel 1000 µL Pipette on left mount, transfer 100µL liquid from each well in source labware 3
  to each well in destination labware 2. Use a new tip each time.
`

export const pcr = `
Write a protocol for the Opentrons OT-2 as described below:

Metadata:
- Application: ThermoPrime Taq DNA Polymerase, with 10x buffer and separate vial of 25 mM MgCl2Thermo Scientific kit PCR amplification
- Robot: OT-2
- API: 2.15

Pipette mount:
- P20 Single Channel is mounted on the right side

Modules:
- Thermocycler module is present on slot 7
- Temperature module is place on slot 3

Labware:
- Source sample labware is Opentrons 96 Well Aluminum Block with NEST Well Plate 100 µL plate placed on slot 1
- Source mastermix labware is Opentrons 24 Well Aluminum Block with NEST 1.5 mL Snapcap, placed on temperature module on slot 3
- Destination Labware is an Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt placed on thermocycler module on slot 7
- 20 ul Filter tiprack is used on slot 4

Well allocation:
- source wells are first 41 wells column wise in both master mix and sample source plates
- destination wells: first 41 wells column wise on thermocycler

Commands:
Note that every step is a single entity. Do not combine. Also, every step should be performed in order.
1. The total number of samples is 41
2. Set the thermocycler such that:
 - block temperature is 6 degree C 
 - lid temperature to 90 degree C
 - lid open 
3. Set the master mix temperature module at 10 C. The temperature module wait time is 50 seconds.
4. Transfer 10 uL of mastermix from source well to destination well. Use the same pipette tip for all transfers.
5. Transfer 3 ul of sample to destination well reusing tip everytime. After dispensing, mix the sample and mastermix
of 13 ul total volume 4 times and then perform blowout before dropping tip.
6. Close the lid of the thermocycler.
7. Set the thermocycle to following parameters  (**note that each step is independent**):
   Step 1: 66 degree C for 47 seconds for 1 cycles
   Step 2: 88 degree C for 28 seconds, 82 degree C for 14 seconds, 68 degree C for 68 seconds for 15 cycles
   Step 3: 70 degree C for 240 seconds for 1 cycles
Then, execute thermocycler profile for each step.
8. After the above three steps are completed, hold thermocycler block at 4 C
9. Open thermocycler lid
10. Deactivate the temperature modules
`

export const flexPcr = `
Write a protocol for the Opentrons Flex as described below: 

Metadata and requirements:
- Application: GeneAmp2x PCR amplification
- Robot: Flex
- API: 2.15

Pipette mount:
- Flex 1-Channel 50 µL Pipette is mounted on the right side

Modules and adapters:
- Thermocycler GEN 2 module is present on slot A1+B1
- Temperature module GEN 2 is place on slot D3

Labware:
- Source sample labware is Opentrons 96 Well Aluminum Block with NEST Well Plate 100 µL plate placed on slot D1
- Source mastermix labware is Opentrons 24 Well Aluminum Block with NEST 1.5 mL Snapcap, placed on temperature module on slot D3
- Destination Labware is an Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt placed on thermocycler GEN 2 module
- Opentrons Flex 96 Filter Tip Rack 50 µL is used on slot C1

Sample position:
- source wells are first 64 wells column wise in both master mix and sample source plates
- destination wells: first 64 wells column wise on thermocycler

Commands:
Note that every step is a single entity. Do not combine. Also, every step should be performed in order.
1. The total number of samples is 64
2. Set the thermocycler such that
 - block temperature is 6 degree C
 - lid temperature to 90 degree C
 - lid open 
3. Set the master mix temperature module at 10 C. The temperature module wait time is 50 seconds.
4. Transfer 10 uL of mastermix from source well to destination well. Use the same pipette tip for all transfers.
5. Transfer 3 ul of sample to destination well reusing tip everytime. After dispensing, mix the sample and mastermix
of 13 ul total volume 4 times and then perform blowout before dropping tip.
6. Close the lid of the thermocycler.
7. Set the thermocycle to following parameters  (**note that each step is independent**):
   Step 1: 66 degree C for 47 seconds for 1 cycles
   Step 2: 88 degree C for 28 seconds, 82 degree C for 14 seconds, 68 degree C for 68 seconds for 15 cycles
   Step 3: 70 degree C for 240 seconds for 1 cycles
Then, execute thermocycler profile for each step.
8. After the above three steps are completed, hold thermocycler block at 4 C
9. Open thermocycler lid
10. Deactivate the temperature modules
`
