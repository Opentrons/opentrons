import _uncastedProtocolMultipleTipracks from '@opentrons/shared-data/protocol/fixtures/5/multipleTipracks.json'
import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/5/multipleTipracksWithTC.json'
import { getOnePipettePositionCheckSteps } from '../utils/getOnePipettePositionCheckSteps'
import type { ProtocolFileV5 } from '@opentrons/shared-data'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import type { LabwarePositionCheckStep } from '../types'
import { SECTIONS } from '../constants'

const protocolMultipleTipracks = _uncastedProtocolMultipleTipracks as ProtocolFileV5<any>
const protocolWithTC = _uncastedProtocolWithTC as ProtocolFileV5<any>

describe('getOnePipettePositionCheckSteps', () => {
  it('should check tiprack, pick up a tip at the final tiprack, move to all remaining labware, and drop the tip', () => {
    const primaryPipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const labware = protocolMultipleTipracks.labware
    const labwareDefinitions = protocolMultipleTipracks.labwareDefinitions
    const modules = protocolMultipleTipracks.modules

    const tiprackInSlot1Id =
      '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1'
    const tiprackInSlot2Id = 'e24818a0-0042-11ec-8258-f7ffdf5ad45a'
    const resevoirId =
      '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1'

    // move to all tiprack locations in order
    const moveToWellCommandFirstTiprack: Command = {
      command: 'moveToWell',
      params: {
        pipette: primaryPipetteId,
        labware: tiprackInSlot1Id, // tiprack in slot 1
        well: 'A1',
      },
    }

    const moveToWellCommandSecondTiprack: Command = {
      command: 'moveToWell',
      params: {
        pipette: primaryPipetteId,
        labware: tiprackInSlot2Id, // tiprack in slot 2
        well: 'A1',
      },
    }

    const pickupTipAtLastTiprackCommand: Command = {
      command: 'pickUpTip',
      params: {
        pipette: primaryPipetteId,
        labware: tiprackInSlot2Id,
        well: 'A1',
      },
    }

    const moveToWellCommandFirstLabware: Command = {
      command: 'moveToWell',
      params: {
        pipette: primaryPipetteId,
        labware: resevoirId,
        well: 'A1',
      },
    }

    const dropTipIntoLastTiprackCommand: Command = {
      command: 'dropTip',
      params: {
        pipette: primaryPipetteId,
        labware: tiprackInSlot2Id,
        well: 'A1',
      },
    }

    const allCommands: LabwarePositionCheckStep[] = [
      {
        labwareId: tiprackInSlot1Id,
        section: SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellCommandFirstTiprack],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellCommandSecondTiprack],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [pickupTipAtLastTiprackCommand],
      },
      {
        labwareId: resevoirId,
        section: SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
        commands: [moveToWellCommandFirstLabware],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: SECTIONS.RETURN_TIP,
        commands: [dropTipIntoLastTiprackCommand],
      },
    ]

    expect(
      getOnePipettePositionCheckSteps({
        primaryPipetteId,
        labware,
        labwareDefinitions,
        modules,
      })
    ).toEqual(allCommands)
  })
  it('should check tiprack, pick up a tip at the final tiprack, move to all remaining labware (and open TC lid), and drop the tip', () => {
    const primaryPipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const labware = protocolWithTC.labware
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

    // move to all tiprack locations in order
    const moveToWellCommandFirstTiprack: Command = {
      command: 'moveToWell',
      params: {
        pipette: primaryPipetteId,
        labware: tiprackInSlot1Id, // tiprack in slot 1
        well: 'A1',
      },
    }

    const moveToWellCommandSecondTiprack: Command = {
      command: 'moveToWell',
      params: {
        pipette: primaryPipetteId,
        labware: tiprackInSlot2Id, // tiprack in slot 2
        well: 'A1',
      },
    }

    const pickupTipAtLastTiprackCommand: Command = {
      command: 'pickUpTip',
      params: {
        pipette: primaryPipetteId,
        labware: tiprackInSlot2Id,
        well: 'A1',
      },
    }

    const moveToWellCommandFirstLabware: Command = {
      command: 'moveToWell',
      params: {
        pipette: primaryPipetteId,
        labware: resevoirId,
        well: 'A1',
      },
    }

    const openTCLidCommand: Command = {
      command: 'thermocycler/openLid',
      params: {
        module: TCId,
      },
    }

    const moveToWellAfterOpeningTCLidCommand: Command = {
      command: 'moveToWell',
      params: {
        pipette: primaryPipetteId,
        labware: TCWellPlateId,
        well: 'A1',
      },
    }

    const dropTipIntoLastTiprackCommand: Command = {
      command: 'dropTip',
      params: {
        pipette: primaryPipetteId,
        labware: tiprackInSlot2Id,
        well: 'A1',
      },
    }

    const allCommands: LabwarePositionCheckStep[] = [
      {
        labwareId: tiprackInSlot1Id,
        section: SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellCommandFirstTiprack],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [moveToWellCommandSecondTiprack],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
        commands: [pickupTipAtLastTiprackCommand],
      },
      {
        labwareId: resevoirId,
        section: SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
        commands: [moveToWellCommandFirstLabware],
      },
      {
        labwareId: TCWellPlateId,
        section: SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
        commands: [openTCLidCommand, moveToWellAfterOpeningTCLidCommand],
      },
      {
        labwareId: tiprackInSlot2Id,
        section: SECTIONS.RETURN_TIP,
        commands: [dropTipIntoLastTiprackCommand],
      },
    ]

    expect(
      getOnePipettePositionCheckSteps({
        primaryPipetteId,
        labware,
        labwareDefinitions,
        modules,
      })
    ).toEqual(allCommands)
  })
})
