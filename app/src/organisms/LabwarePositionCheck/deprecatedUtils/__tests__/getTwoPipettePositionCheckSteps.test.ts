import _uncastedProtocolMultipleTipracks from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracks.json'
import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'
import { getTwoPipettePositionCheckSteps } from '../getTwoPipettePositionCheckSteps'
import { DEPRECATED_SECTIONS } from '../../constants'
import type { ProtocolAnalysisFile, LoadedModule } from '@opentrons/shared-data'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { DeprecatedLabwarePositionCheckStep } from '../../types'

const protocolMultipleTipracks = (_uncastedProtocolMultipleTipracks as unknown) as ProtocolAnalysisFile
const protocolWithTC = (_uncastedProtocolWithTC as unknown) as ProtocolAnalysisFile

describe('getTwoPipettePositionCheckSteps', () => {
  it('should move to all tipracks that the secondary pipette uses, move to all tipracks with that the primary pipette uses, pick up a tip at the final tiprack that the primary pipette uses, move to all remaining labware, and drop the tip back in the tiprack that the primary pipette uses', () => {
    const primaryPipetteId = '50d23e00-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const secondaryPipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a'
    const labware = [
      {
        id: 'fixedTrash',
        displayName: 'Trash',
        definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
        loadName: 'opentrons_1_trash_1100ml_fixed',
      },
      {
        id:
          '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
        displayName: 'Opentrons 96 Tip Rack 300 µL',
        definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
        loadName: 'opentrons_96_tiprack_300ul',
      },
      {
        id:
          '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1',
        displayName: 'NEST 12 Well Reservoir 15 mL',
        definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
        loadName: 'nest_12_reservoir_15ml',
      },
      {
        id: 'e24818a0-0042-11ec-8258-f7ffdf5ad45a',
        displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
        definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
        loadName: 'opentrons_96_tiprack_300ul',
      },
    ]
    const labwareDefinitions = protocolMultipleTipracks.labwareDefinitions
    const modules = [] as LoadedModule[]
    const commands = protocolMultipleTipracks.commands

    const tiprackInSlot1Id =
      '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1'
    const tiprackInSlot2Id = 'e24818a0-0042-11ec-8258-f7ffdf5ad45a'
    const resevoirId =
      '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1'

    const moveToWellSeconaryPipetteSecondTiprack: CreateCommand = {
      commandType: 'moveToWell',
      params: {
        pipetteId: secondaryPipetteId,
        labwareId: tiprackInSlot2Id,
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const moveToWellPrimaryPipetteFirstTiprack: CreateCommand = {
      commandType: 'moveToWell',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot1Id,
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const pickupTipAtLastTiprackPrimaryPipetteUses: CreateCommand = {
      commandType: 'pickUpTip',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot1Id,
        wellName: 'A1',
      },
    }

    const moveToWellFirstLabware: CreateCommand = {
      commandType: 'moveToWell',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: resevoirId,
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const dropTipIntoLastTiprackPrimaryPipetteUses: CreateCommand = {
      commandType: 'dropTip',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot1Id,
        wellName: 'A1',
      },
    }

    const allSteps: DeprecatedLabwarePositionCheckStep[] = [
      {
        labwareId: tiprackInSlot2Id,
        section: DEPRECATED_SECTIONS.SECONDARY_PIPETTE_TIPRACKS,
        commands: [moveToWellSeconaryPipetteSecondTiprack],
      },
      {
        labwareId: tiprackInSlot1Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellPrimaryPipetteFirstTiprack],
      },
      {
        labwareId: tiprackInSlot1Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [pickupTipAtLastTiprackPrimaryPipetteUses],
      },
      {
        labwareId: resevoirId,
        section:
          DEPRECATED_SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
        commands: [moveToWellFirstLabware],
      },
      {
        labwareId: tiprackInSlot1Id,
        section: DEPRECATED_SECTIONS.RETURN_TIP,
        commands: [dropTipIntoLastTiprackPrimaryPipetteUses],
      },
    ]

    expect(
      getTwoPipettePositionCheckSteps({
        primaryPipetteId,
        secondaryPipetteId,
        //  @ts-expect-error
        labware,
        labwareDefinitions,
        modules,
        commands,
      })
    ).toEqual(allSteps)
  })
  it('should move to all tipracks that the secondary pipette uses, move to all tipracks with the primary pipette uses, pick up a tip at the final tiprack that the primary pipette uses, move to all remaining labware (and open TC lid), and drop the tip back in the tiprack that the primary pipette uses', () => {
    const primaryPipetteId = '50d23e00-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const secondaryPipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a'
    const labware = [
      {
        id: 'fixedTrash',
        displayName: 'Trash',
        definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
        loadName: 'opentrons_1_trash_1100ml_fixed',
      },
      {
        id:
          '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
        displayName: 'Opentrons 96 Tip Rack 300 µL',
        definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
        loadName: 'opentrons_96_tiprack_300ul',
      },
      {
        id:
          '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1',
        displayName: 'NEST 12 Well Reservoir 15 mL',
        definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
        loadName: 'nest_12_reservoir_15ml',
      },
      {
        id: 'e24818a0-0042-11ec-8258-f7ffdf5ad45a',
        displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
        definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
        loadName: 'opentrons_96_tiprack_300ul',
      },
      {
        id:
          '1dc0c050-0122-11ec-88a3-f1745cf9b36c:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
        displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
        definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
        loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
      },
    ]
    const labwareDefinitions = protocolWithTC.labwareDefinitions
    const modules = [
      {
        id: '18f0c1b0-0122-11ec-88a3-f1745cf9b36c:thermocyclerModuleType',
        model: 'thermocyclerModuleV1',
      },
    ] as LoadedModule[]
    const commands = protocolWithTC.commands

    const TCId = '18f0c1b0-0122-11ec-88a3-f1745cf9b36c:thermocyclerModuleType'
    const tiprackInSlot1Id =
      '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1'
    const tiprackInSlot2Id = 'e24818a0-0042-11ec-8258-f7ffdf5ad45a'
    const resevoirId =
      '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1'
    const TCWellPlateId =
      '1dc0c050-0122-11ec-88a3-f1745cf9b36c:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'

    const moveToWellSeconaryPipetteSecondTiprack: CreateCommand = {
      commandType: 'moveToWell',
      params: {
        pipetteId: secondaryPipetteId,
        labwareId: tiprackInSlot2Id,
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const moveToWellPrimaryPipetteFirstTiprack: CreateCommand = {
      commandType: 'moveToWell',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot1Id,
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const pickupTipAtLastTiprackPrimaryPipetteUses: CreateCommand = {
      commandType: 'pickUpTip',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot1Id,
        wellName: 'A1',
      },
    }

    const moveToWellFirstLabware: CreateCommand = {
      commandType: 'moveToWell',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: resevoirId,
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const openTCLidCommand: CreateCommand = {
      commandType: 'thermocycler/openLid',
      params: {
        moduleId: TCId,
      },
    }

    const moveToWellAfterOpeningTCLidCommand: CreateCommand = {
      commandType: 'moveToWell',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: TCWellPlateId,
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const dropTipIntoLastTiprackPrimaryPipetteUses: CreateCommand = {
      commandType: 'dropTip',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot1Id,
        wellName: 'A1',
      },
    }

    const allSteps: DeprecatedLabwarePositionCheckStep[] = [
      {
        labwareId: tiprackInSlot2Id,
        section: DEPRECATED_SECTIONS.SECONDARY_PIPETTE_TIPRACKS,
        commands: [moveToWellSeconaryPipetteSecondTiprack],
      },
      {
        labwareId: tiprackInSlot1Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellPrimaryPipetteFirstTiprack],
      },
      {
        labwareId: tiprackInSlot1Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [pickupTipAtLastTiprackPrimaryPipetteUses],
      },
      {
        labwareId: resevoirId,
        section:
          DEPRECATED_SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
        commands: [moveToWellFirstLabware],
      },
      {
        labwareId: TCWellPlateId,
        section:
          DEPRECATED_SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
        commands: [openTCLidCommand, moveToWellAfterOpeningTCLidCommand],
      },
      {
        labwareId: tiprackInSlot1Id,
        section: DEPRECATED_SECTIONS.RETURN_TIP,
        commands: [dropTipIntoLastTiprackPrimaryPipetteUses],
      },
    ]

    expect(
      getTwoPipettePositionCheckSteps({
        primaryPipetteId,
        secondaryPipetteId,
        //  @ts-expect-error
        labware,
        labwareDefinitions,
        modules,
        commands,
      })
    ).toEqual(allSteps)
  })
})
