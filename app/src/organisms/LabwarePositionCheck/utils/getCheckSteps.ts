import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { SECTIONS } from '../constants'
import { getLabwareDefinitionsFromCommands } from './labware'
import {
  getLabwareDefURI,
  getIsTiprack,
  getSlotHasMatingSurfaceUnitVector,
  FIXED_TRASH_ID,
} from '@opentrons/shared-data'
import { getLabwareLocationCombos } from '../../ApplyHistoricOffsets/hooks/getLabwareLocationCombos'

import type {
  LabwarePositionCheckStep,
  CheckTipRacksStep,
  PickUpTipStep,
  CheckLabwareStep,
  ReturnTipStep,
} from '../types'
import type {
  RunTimeCommand,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { PickUpTipRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { LabwareOffsetLocation } from '@opentrons/api-client'

interface LPCArgs {
  primaryPipetteId: string
  secondaryPipetteId: string | null
  labware: ProtocolAnalysisOutput['labware']
  modules: ProtocolAnalysisOutput['modules']
  commands: RunTimeCommand[]
}

const OT2_STANDARD_DECK_DEF = standardDeckDef as any

const PICK_UP_TIP_LOCATION: LabwareOffsetLocation = { slotName: '2' }

export const getCheckSteps = (args: LPCArgs): LabwarePositionCheckStep[] => {
  const checkTipRacksSectionSteps = getCheckTipRackSectionSteps(args)
  if (checkTipRacksSectionSteps.length < 1) return []

  const lastTiprackCheckStep =
    checkTipRacksSectionSteps[checkTipRacksSectionSteps.length - 1]
  // TODO(BC, 2022-11-30): once robot model is available from analysis output, this should only
  // be a conflict with heater shaker positioning on OT2's so something like `isOT2Protocol &&`
  // should be prepended to this boolean
  const cannotAccessDefaultPickUpTipLocation = args.modules.some(m =>
    ['1', '3'].includes(m.location.slotName)
  )
  const pickUpTipSectionStep: PickUpTipStep = {
    section: SECTIONS.PICK_UP_TIP,
    labwareId: lastTiprackCheckStep.labwareId,
    pipetteId: lastTiprackCheckStep.pipetteId,
    location: cannotAccessDefaultPickUpTipLocation
      ? lastTiprackCheckStep.location
      : PICK_UP_TIP_LOCATION,
  }
  const checkLabwareSectionSteps = getCheckLabwareSectionSteps(args)

  const returnTipSectionStep: ReturnTipStep = {
    section: SECTIONS.RETURN_TIP,
    labwareId: lastTiprackCheckStep.labwareId,
    pipetteId: lastTiprackCheckStep.pipetteId,
    location: cannotAccessDefaultPickUpTipLocation
      ? lastTiprackCheckStep.location
      : PICK_UP_TIP_LOCATION,
  }

  return [
    { section: SECTIONS.BEFORE_BEGINNING },
    ...checkTipRacksSectionSteps,
    pickUpTipSectionStep,
    ...checkLabwareSectionSteps,
    returnTipSectionStep,
    { section: SECTIONS.RESULTS_SUMMARY },
  ]
}

function getCheckTipRackSectionSteps(args: LPCArgs): CheckTipRacksStep[] {
  const {
    secondaryPipetteId,
    primaryPipetteId,
    commands,
    labware,
    modules,
  } = args

  const labwareLocationCombos = getLabwareLocationCombos(
    commands,
    labware,
    modules
  )
  const uniqPrimaryPipettePickUpTipCommands = commands.reduce<
    PickUpTipRunTimeCommand[]
  >((acc, command) => {
    if (
      command.commandType === 'pickUpTip' &&
      command.params.pipetteId === primaryPipetteId &&
      !acc.some(c => c.params.labwareId === command.params.labwareId)
    ) {
      return [...acc, command]
    }
    return acc
  }, [])
  const onlySecondaryPipettePickUpTipCommands = commands.reduce<
    PickUpTipRunTimeCommand[]
  >((acc, command) => {
    if (
      command.commandType === 'pickUpTip' &&
      command.params.pipetteId === secondaryPipetteId &&
      !uniqPrimaryPipettePickUpTipCommands.some(
        c => c.params.labwareId === command.params.labwareId
      ) &&
      !acc.some(c => c.params.labwareId === command.params.labwareId)
    ) {
      return [...acc, command]
    }
    return acc
  }, [])

  return [
    ...onlySecondaryPipettePickUpTipCommands,
    ...uniqPrimaryPipettePickUpTipCommands,
  ].reduce<CheckTipRacksStep[]>((acc, { params }) => {
    const labwareLocations = labwareLocationCombos.filter(
      combo => combo.labwareId === params.labwareId
    )
    return [
      ...acc,
      ...labwareLocations.map(({ location }) => ({
        section: SECTIONS.CHECK_TIP_RACKS,
        labwareId: params.labwareId,
        pipetteId: params.pipetteId,
        location,
      })),
    ]
  }, [])
}

function getCheckLabwareSectionSteps(args: LPCArgs): CheckLabwareStep[] {
  const { labware, modules, commands, primaryPipetteId } = args
  const labwareDefinitions = getLabwareDefinitionsFromCommands(commands)

  return labware.reduce<CheckLabwareStep[]>((acc, currentLabware) => {
    const labwareDef = labwareDefinitions.find(
      def => getLabwareDefURI(def) === currentLabware.definitionUri
    )
    if (currentLabware.id === FIXED_TRASH_ID) return acc
    if (labwareDef == null) {
      throw new Error(
        `could not find labware definition within protocol with uri: ${currentLabware.definitionUri}`
      )
    }
    const isTiprack = getIsTiprack(labwareDef)
    if (isTiprack) return acc // skip any labware that is a tiprack

    const labwareLocationCombos = getLabwareLocationCombos(
      commands,
      labware,
      modules
    )
    return [
      ...acc,
      ...labwareLocationCombos.reduce<CheckLabwareStep[]>(
        (innerAcc, { location, labwareId, moduleId }) => {
          if (
            !getSlotHasMatingSurfaceUnitVector(
              OT2_STANDARD_DECK_DEF,
              location.slotName
            ) ||
            labwareId !== currentLabware.id
          ) {
            return innerAcc
          }

          return [
            ...innerAcc,
            {
              section: SECTIONS.CHECK_LABWARE,
              labwareId,
              pipetteId: primaryPipetteId,
              location,
              moduleId,
            },
          ]
        },
        []
      ),
    ]
  }, [])
}
