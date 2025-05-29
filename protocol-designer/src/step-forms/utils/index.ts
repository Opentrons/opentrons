import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import values from 'lodash/values'

import {
  FLEX_ROBOT_TYPE,
  GEN_ONE_MULTI_PIPETTES,
  getCutoutDisplayName,
  getPipetteSpecsV2,
  OT2_CUTOUT_BY_SLOT_ID,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import {
  getCutoutIdByAddressableArea,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import { hydrateField } from '../../steplist/fieldLevel'

import type {
  AddressableAreaName,
  CreateCommand,
  CutoutId,
  DeckSlotId,
  LoadLabwareCreateCommand,
  LoadModuleCreateCommand,
  ModuleType,
  MoveLabwareCreateCommand,
  RobotType,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  NormalizedPipette,
  NormalizedPipetteById,
  PipetteEntities,
  PipetteEntity,
} from '@opentrons/step-generation'
import type { FormData, HydratedFormData } from '../../form-types'
import type { LabwareDefByDefURI } from '../../labware-defs'
import type { DeckSlot } from '../../types'
import type {
  FormPipette,
  FormPipettesByMount,
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '../types'

export { createPresavedStepForm } from './createPresavedStepForm'

const MOVABLE_TRASH_CUTOUTS = [
  {
    value: 'cutoutA3',
    slot: 'A3',
  },
  {
    value: 'cutoutA1',
    slot: 'A1',
  },
  {
    value: 'cutoutB1',
    slot: 'B1',
  },
  {
    value: 'cutoutB3',
    slot: 'B3',
  },
  {
    value: 'cutoutC1',
    slot: 'C1',
  },
  {
    value: 'cutoutC3',
    slot: 'C3',
  },
  {
    value: 'cutoutD1',
    slot: 'D1',
  },
  {
    value: 'cutoutD3',
    slot: 'D3',
  },
]

export function getIdsInRange<T extends string | number>(
  orderedIds: T[],
  startId: T,
  endId: T
): T[] {
  const startIdx = orderedIds.findIndex(id => id === startId)
  const endIdx = orderedIds.findIndex(id => id === endId)
  console.assert(
    startIdx !== -1,
    `start step "${String(startId)}" does not exist in orderedStepIds`
  )
  console.assert(
    endIdx !== -1,
    `end step "${String(endId)}" does not exist in orderedStepIds`
  )
  console.assert(
    endIdx >= startIdx,
    `expected end index to be greater than or equal to start index, got "${startIdx}", "${endIdx}"`
  )
  return orderedIds.slice(startIdx, endIdx + 1)
}
// NOTE: deck items include labware and modules
export function getDeckItemIdInSlot(
  itemIdToSlot: Record<string, DeckSlotId>,
  slot: DeckSlotId
): string | null | undefined {
  const idsForSourceSlot = Object.entries(itemIdToSlot)
    .filter(([id, labwareSlot]) => labwareSlot === slot)
    .map(([id, labwareSlot]) => id)
  console.assert(
    idsForSourceSlot.length < 2,
    `multiple deck items in slot ${slot}, expected none or one`
  )
  return idsForSourceSlot[0]
}
export function denormalizePipetteEntities(
  pipetteInvariantProperties: NormalizedPipetteById,
  labwareDefs: LabwareDefByDefURI,
  pipetteLocationUpdate: Record<string, string>
): PipetteEntities {
  return reduce(
    pipetteInvariantProperties,
    (acc: PipetteEntities, pipette: NormalizedPipette): PipetteEntities => {
      const pipetteId = pipette.id
      const spec = getPipetteSpecsV2(pipette.name)
      if (!spec) {
        throw new Error(
          `no pipette spec for pipette id "${pipetteId}", name "${pipette.name}"`
        )
      }
      const is96Channel = spec.channels === 96
      const pipetteEntity: PipetteEntity = {
        ...pipette,
        spec,
        tiprackLabwareDef: pipette.tiprackDefURI.map(def => labwareDefs[def]),
        pythonName: is96Channel
          ? 'pipette'
          : `pipette_${pipetteLocationUpdate[pipetteId]}`,
      }
      return { ...acc, [pipetteId]: pipetteEntity }
    },
    {}
  )
}

export const getSlotIdsBlockedBySpanningForThermocycler = (
  initialDeckSetup: InitialDeckSetup,
  robotType: RobotType
): DeckSlot[] => {
  const loadedThermocycler = values(initialDeckSetup.modules).find(
    ({ type }: ModuleOnDeck) => type === THERMOCYCLER_MODULE_TYPE
  )
  if (loadedThermocycler != null && robotType === FLEX_ROBOT_TYPE) {
    return ['A1', 'B1']
  } else if (loadedThermocycler != null && robotType === OT2_ROBOT_TYPE) {
    return ['7', '8', '10', '11']
  }

  return []
}

export const getSlotIsEmpty = (
  initialDeckSetup: InitialDeckSetup,
  slot: string,
  discountTrash: boolean
): boolean => {
  //  filter out trash slots only when selecting slot but not when
  //  dragging/dropping
  if (
    Object.values(initialDeckSetup.additionalEquipmentOnDeck).some(
      ae =>
        (ae.name === 'trashBin' || ae.name === 'wasteChute') &&
        getCutoutDisplayName(ae.location as CutoutId) === slot
    ) &&
    discountTrash
  ) {
    return false
  }
  const mappedCutout = OT2_CUTOUT_BY_SLOT_ID[slot]
  const modulesInSlot = values(initialDeckSetup.modules).filter(
    (moduleOnDeck: ModuleOnDeck) => {
      return mappedCutout != null
        ? moduleOnDeck.slot === slot
        : slot.includes(moduleOnDeck.slot)
    }
  )

  const labwareInSlot = values(initialDeckSetup.labware).filter(
    (labware: LabwareOnDeckType) =>
      getSlotInLocationStack(labware.stack) === slot
  )

  return modulesInSlot.length === 0 && labwareInSlot.length === 0
}

export const getIsCrashablePipetteSelected = (
  pipettesByMount: FormPipettesByMount
): boolean => {
  const { left, right } = pipettesByMount
  return [left, right].some(
    (formPipette: FormPipette | null | undefined) =>
      // @ts-expect-error(sa, 2021-6-10): argument in .includes must be a string, since GEN_ONE_MULTI_PIPETTES is a list of strings
      formPipette && GEN_ONE_MULTI_PIPETTES.includes(formPipette?.pipetteName)
  )
}
export const getHasGen1MultiChannelPipette = (
  pipettes: InitialDeckSetup['pipettes']
): boolean => {
  const pipetteIds = Object.keys(pipettes)
  return pipetteIds.some(pipetteId =>
    GEN_ONE_MULTI_PIPETTES.includes(pipettes[pipetteId]?.name)
  )
}
export const getIsModuleOnDeck = (
  modules: InitialDeckSetup['modules'],
  moduleType: ModuleType
): boolean => {
  const moduleIds = Object.keys(modules)
  return moduleIds.some(moduleId => modules[moduleId]?.type === moduleType)
}

export function getHydratedForm(
  rawForm: FormData,
  invariantContext: InvariantContext
): HydratedFormData {
  const hydratedForm = mapValues(rawForm, (value, name) =>
    hydrateField(invariantContext, name, value as string)
  )
  //  @ts-expect-error because hydrateField doesn't hydrate every formField type
  //  need to udpate to hdyrate every field, will do this in a followup
  return hydratedForm
}

export const getUnoccupiedSlotForTrash = (
  commands: CreateCommand[],
  hasWasteChuteCommands: boolean,
  stagingAreaSlotNames: AddressableAreaName[]
): string => {
  const wasteChuteSlot = hasWasteChuteCommands ? [WASTE_CHUTE_CUTOUT] : []
  const stagingAreaCutoutIds = stagingAreaSlotNames.map(slotName =>
    getCutoutIdByAddressableArea(
      slotName,
      'stagingAreaRightSlot',
      FLEX_ROBOT_TYPE
    )
  )
  const allLoadLabwareSlotNames = Object.values(commands)
    .filter(
      (command): command is LoadLabwareCreateCommand =>
        command.commandType === 'loadLabware'
    )
    .reduce((acc: string[], command) => {
      const location = command.params.location
      if (
        location !== 'offDeck' &&
        location !== 'systemLocation' &&
        location !== null &&
        'slotName' in location
      ) {
        return [...acc, location.slotName]
      }
      return acc
    }, [])

  const allLoadModuleSlotNames = Object.values(commands)
    .filter(
      (command): command is LoadModuleCreateCommand =>
        command.commandType === 'loadModule'
    )
    .flatMap(command => {
      //  special-casing Thermocycler
      if (command.params.model === THERMOCYCLER_MODULE_V2) {
        return ['A1', command.params.location.slotName]
      } else {
        return command.params.location.slotName
      }
    })

  const allMoveLabwareLocations = Object.values(commands)
    .filter(
      (command): command is MoveLabwareCreateCommand =>
        command.commandType === 'moveLabware'
    )
    .reduce((acc: string[], command) => {
      const newLocation = command.params.newLocation
      if (
        newLocation !== 'offDeck' &&
        newLocation !== 'systemLocation' &&
        newLocation !== null &&
        'slotName' in newLocation
      ) {
        return [...acc, newLocation.slotName]
      }
      return acc
    }, [])

  const unoccupiedSlot = MOVABLE_TRASH_CUTOUTS.find(
    cutout =>
      !allLoadLabwareSlotNames.includes(cutout.slot) &&
      !allLoadModuleSlotNames.includes(cutout.slot) &&
      !allMoveLabwareLocations.includes(cutout.slot) &&
      !wasteChuteSlot.includes(cutout.value as typeof WASTE_CHUTE_CUTOUT) &&
      !stagingAreaCutoutIds.includes(cutout.value as CutoutId)
  )
  //  if all slots are occupied except for D3 on a staging area, then auto-generate the waste chute
  if (
    unoccupiedSlot == null &&
    !allLoadLabwareSlotNames.includes('D3') &&
    stagingAreaCutoutIds.includes(WASTE_CHUTE_CUTOUT)
  ) {
    return WASTE_CHUTE_CUTOUT
  }

  if (unoccupiedSlot == null) {
    console.error(
      'Expected to find an unoccupied slot for auto-generating a trash bin but could not'
    )
    return ''
  }

  return unoccupiedSlot.slot
}
