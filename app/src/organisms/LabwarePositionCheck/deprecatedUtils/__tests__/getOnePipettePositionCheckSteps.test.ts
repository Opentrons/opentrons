import _uncastedProtocolMultipleTipracks from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracks.json'
import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'
import { getOnePipettePositionCheckSteps } from '../getOnePipettePositionCheckSteps'
import { DEPRECATED_SECTIONS } from '../../constants'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { DeprecatedLabwarePositionCheckStep } from '../../types'

const protocolMultipleTipracks = (_uncastedProtocolMultipleTipracks as unknown) as ProtocolAnalysisFile
const protocolWithTC = (_uncastedProtocolWithTC as unknown) as ProtocolAnalysisFile

describe('getOnePipettePositionCheckSteps', () => {
  it('should check all tipracks, pick up a tip at the final tiprack, move to all remaining labware, and drop the tip', () => {
    const primaryPipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
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
    const modules = protocolMultipleTipracks.modules

    const tiprackInSlot1Id =
      '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1'
    const tiprackInSlot2Id = 'e24818a0-0042-11ec-8258-f7ffdf5ad45a'
    const resevoirId =
      '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1'

    const moveToWellFirstTiprack: CreateCommand = {
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

    const moveToWellSecondTiprack: CreateCommand = {
      commandType: 'moveToWell',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot2Id,
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const pickupTipAtLastTiprack: CreateCommand = {
      commandType: 'pickUpTip',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot2Id,
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

    const dropTipIntoLastTiprack: CreateCommand = {
      commandType: 'dropTip',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot2Id,
        wellName: 'A1',
      },
    }

    const allSteps: DeprecatedLabwarePositionCheckStep[] = [
      {
        labwareId: tiprackInSlot1Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellFirstTiprack],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellSecondTiprack],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [pickupTipAtLastTiprack],
      },
      {
        labwareId: resevoirId,
        section:
          DEPRECATED_SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
        commands: [moveToWellFirstLabware],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: DEPRECATED_SECTIONS.RETURN_TIP,
        commands: [dropTipIntoLastTiprack],
      },
    ]

    expect(
      getOnePipettePositionCheckSteps({
        primaryPipetteId,
        //  @ts-expect-error
        labware,
        labwareDefinitions,
        modules,
        commands: protocolMultipleTipracks.commands,
      })
    ).toEqual(allSteps)
  })
  it('should check tiprack, pick up a tip at the final tiprack, move to all remaining labware (and open TC lid), and drop the tip', () => {
    const primaryPipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
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
    const modules = protocolWithTC.modules

    const TCId = '18f0c1b0-0122-11ec-88a3-f1745cf9b36c:thermocyclerModuleType'
    const tiprackInSlot1Id =
      '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1'
    const tiprackInSlot2Id = 'e24818a0-0042-11ec-8258-f7ffdf5ad45a'
    const resevoirId =
      '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1'
    const TCWellPlateId =
      '1dc0c050-0122-11ec-88a3-f1745cf9b36c:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'

    const moveToWellFirstTiprack: CreateCommand = {
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

    const moveToWellSecondTiprack: CreateCommand = {
      commandType: 'moveToWell',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot2Id,
        wellName: 'A1',
        wellLocation: {
          origin: 'top',
        },
      },
    }

    const pickupTipAtLastTiprack: CreateCommand = {
      commandType: 'pickUpTip',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot2Id,
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

    const openTCLid: CreateCommand = {
      commandType: 'thermocycler/openLid',
      params: {
        moduleId: TCId,
      },
    }

    const moveToWellAfterOpeningTCLid: CreateCommand = {
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

    const dropTipIntoLastTiprack: CreateCommand = {
      commandType: 'dropTip',
      params: {
        pipetteId: primaryPipetteId,
        labwareId: tiprackInSlot2Id,
        wellName: 'A1',
      },
    }

    const allSteps: DeprecatedLabwarePositionCheckStep[] = [
      {
        labwareId: tiprackInSlot1Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellFirstTiprack],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellSecondTiprack],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: DEPRECATED_SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [pickupTipAtLastTiprack],
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
        commands: [openTCLid, moveToWellAfterOpeningTCLid],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: DEPRECATED_SECTIONS.RETURN_TIP,
        commands: [dropTipIntoLastTiprack],
      },
    ]

    expect(
      getOnePipettePositionCheckSteps({
        primaryPipetteId,
        // @ts-expect-error
        labware,
        labwareDefinitions,
        modules,
        commands: protocolWithTC.commands,
      })
    ).toEqual(allSteps)
  })
})
