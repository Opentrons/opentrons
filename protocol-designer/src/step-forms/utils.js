// @flow
import assert from 'assert'
import reduce from 'lodash/reduce'
import values from 'lodash/values'
import find from 'lodash/find'
import {
  getPipetteNameSpecs,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  generateNewForm,
  getNextDefaultEngageHeight,
  getNextDefaultMagnetAction,
  getNextDefaultPipetteId,
  getNextDefaultTemperatureModuleId,
  handleFormChange,
} from '../steplist/formLevel'
import {
  getModuleOnDeckByType,
  getMagnetLabwareEngageHeight,
} from '../ui/modules/utils'
import { maskField } from '../steplist/fieldLevel'
import {
  SPAN7_8_10_11_SLOT,
  TC_SPAN_SLOTS,
  GEN_ONE_MULTI_PIPETTES,
} from '../constants'
import type { DeckSlotId, ModuleRealType } from '@opentrons/shared-data'
import type { DeckSlot } from '../types'
import type { FormData, StepType, StepIdType } from '../form-types'
import type { LabwareDefByDefURI } from '../labware-defs'
import type {
  NormalizedPipette,
  NormalizedPipetteById,
  PipetteEntity,
  PipetteEntities,
  LabwareEntities,
  InitialDeckSetup,
  ModuleOnDeck,
  FormPipettesByMount,
  FormPipette,
  LabwareOnDeck as LabwareOnDeckType,
} from './types'
import type { SavedStepFormState, OrderedStepIdsState } from './reducers'

export function getIdsInRange<T: string | number>(
  orderedIds: Array<T>,
  startId: T,
  endId: T
): Array<T> {
  const startIdx = orderedIds.findIndex(id => id === startId)
  const endIdx = orderedIds.findIndex(id => id === endId)
  assert(
    startIdx !== -1,
    `start step "${String(startId)}" does not exist in orderedStepIds`
  )
  assert(
    endIdx !== -1,
    `end step "${String(endId)}" does not exist in orderedStepIds`
  )
  assert(
    endIdx >= startIdx,
    `expected end index to be greater than or equal to start index, got "${startIdx}", "${endIdx}"`
  )
  return orderedIds.slice(startIdx, endIdx + 1)
}

// NOTE: deck items include labware and modules
export function getDeckItemIdInSlot(
  itemIdToSlot: { [itemId: string]: DeckSlotId },
  slot: DeckSlotId
): ?string {
  const idsForSourceSlot = Object.entries(itemIdToSlot)
    .filter(([id, labwareSlot]) => labwareSlot === slot)
    .map(([id, labwareSlot]) => id)
  assert(
    idsForSourceSlot.length < 2,
    `multiple deck items in slot ${slot}, expected none or one`
  )
  return idsForSourceSlot[0]
}

export function denormalizePipetteEntities(
  pipetteInvariantProperties: NormalizedPipetteById,
  labwareDefs: LabwareDefByDefURI
): PipetteEntities {
  return reduce(
    pipetteInvariantProperties,
    (acc: PipetteEntities, pipette: NormalizedPipette): PipetteEntities => {
      const pipetteId = pipette.id
      const spec = getPipetteNameSpecs(pipette.name)
      if (!spec) {
        throw new Error(
          `no pipette spec for pipette id "${pipetteId}", name "${pipette.name}"`
        )
      }

      const pipetteEntity: PipetteEntity = {
        ...pipette,
        spec,
        tiprackLabwareDef: labwareDefs[pipette.tiprackDefURI],
      }
      return { ...acc, [pipetteId]: pipetteEntity }
    },
    {}
  )
}

export const getSlotsBlockedBySpanning = (
  initialDeckSetup: InitialDeckSetup
): Array<DeckSlot> => {
  // NOTE: Ian 2019-10-25 dumb heuristic since there's only one case this can happen now
  if (
    values(initialDeckSetup.modules).some(
      (moduleOnDeck: ModuleOnDeck) =>
        moduleOnDeck.type === THERMOCYCLER_MODULE_TYPE &&
        moduleOnDeck.slot === SPAN7_8_10_11_SLOT
    )
  ) {
    return ['7', '8', '10', '11']
  }
  return []
}

export const getSlotIsEmpty = (
  initialDeckSetup: InitialDeckSetup,
  slot: string
): boolean => {
  if (
    slot === SPAN7_8_10_11_SLOT &&
    TC_SPAN_SLOTS.some(slot => !getSlotIsEmpty(initialDeckSetup, slot))
  ) {
    // special "spanning slot" is not empty if there's anything in the slots that it spans,
    // even when there's no spanning labware/module (eg thermocycler) on the deck
    return false
  } else if (getSlotsBlockedBySpanning(initialDeckSetup).includes(slot)) {
    // if a slot is being blocked by a spanning labware/module (eg thermocycler), it's not empty
    return false
  }

  // NOTE: should work for both deck slots and module slots
  return (
    [
      ...values(initialDeckSetup.modules).filter(
        (moduleOnDeck: ModuleOnDeck) => moduleOnDeck.slot === slot
      ),
      ...values(initialDeckSetup.labware).filter(
        (labware: LabwareOnDeckType) => labware.slot === slot
      ),
    ].length === 0
  )
}

export const getLabwareOnSlot = (
  initialDeckSetup: InitialDeckSetup,
  slot: string
): LabwareOnDeckType => {
  return find(initialDeckSetup.labware, labware => labware.slot === slot)
}

export const getIsCrashablePipetteSelected = (
  pipettesByMount: FormPipettesByMount
): boolean => {
  const { left, right } = pipettesByMount
  return [left, right].some(
    (formPipette: ?FormPipette) =>
      formPipette && GEN_ONE_MULTI_PIPETTES.includes(formPipette?.pipetteName)
  )
}

export const getHasGen1MultiChannelPipette = (
  pipettes: $PropertyType<InitialDeckSetup, 'pipettes'>
): boolean => {
  const pipetteIds = Object.keys(pipettes)
  return pipetteIds.some(pipetteId =>
    GEN_ONE_MULTI_PIPETTES.includes(pipettes[pipetteId]?.name)
  )
}

export const getIsModuleOnDeck = (
  modules: $PropertyType<InitialDeckSetup, 'modules'>,
  moduleType: ModuleRealType
): boolean => {
  const moduleIds = Object.keys(modules)
  return moduleIds.some(moduleId => modules[moduleId]?.type === moduleType)
}

// TODO IMMED add test
export const createPresavedStepForm = ({
  stepId,
  stepType,
  pipetteEntities,
  labwareEntities,
  savedStepForms,
  orderedStepIds,
  initialDeckSetup,
}: {|
  stepId: StepIdType,
  stepType: StepType,
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities,
  savedStepForms: SavedStepFormState,
  orderedStepIds: OrderedStepIdsState,
  initialDeckSetup: InitialDeckSetup,
|}): FormData => {
  let formData = generateNewForm({
    // TODO IMMEDIATELY this should  be 'default values'
    stepId,
    stepType,
  })

  const defaultPipetteId = getNextDefaultPipetteId(
    savedStepForms,
    orderedStepIds,
    initialDeckSetup.pipettes
  )

  // For a pristine step, if there is a `pipette` field in the form
  // (added by upstream `getDefaultsForStepType` fn),
  // then set `pipette` field of new steps to the next default pipette id.
  //
  // In order to trigger dependent field changes (eg default disposal volume),
  // update the form thru handleFormChange.
  const formHasPipetteField = formData && 'pipette' in formData
  if (formHasPipetteField && defaultPipetteId) {
    const updatedFields = handleFormChange(
      { pipette: defaultPipetteId },
      formData,
      pipetteEntities,
      labwareEntities
    )

    formData = {
      ...formData,
      // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
      ...updatedFields,
    }
  }

  // For a pristine step, if there is a `moduleId` field in the form
  // (added by upstream `getDefaultsForStepType` fn),
  // then set `moduleID` field of new steps to the next default module id.
  const formHasModuleIdField = formData && 'moduleId' in formData
  if (
    (stepType === 'pause' || stepType === 'temperature') &&
    formHasModuleIdField
  ) {
    const moduleId = getNextDefaultTemperatureModuleId(
      savedStepForms,
      orderedStepIds,
      initialDeckSetup.modules
    )
    formData = {
      ...formData,
      moduleId,
    }
  }

  // auto-select magnetic module if it exists (assumes no more than 1 magnetic module)
  if (stepType === 'magnet') {
    const moduleId =
      getModuleOnDeckByType(initialDeckSetup, MAGNETIC_MODULE_TYPE)?.id || null
    const magnetAction = getNextDefaultMagnetAction(
      savedStepForms,
      orderedStepIds
    )

    const defaultEngageHeight = getMagnetLabwareEngageHeight(
      initialDeckSetup,
      moduleId
    )

    const stringDefaultEngageHeight = defaultEngageHeight
      ? maskField('engageHeight', defaultEngageHeight)
      : null

    const prevEngageHeight = getNextDefaultEngageHeight(
      savedStepForms,
      orderedStepIds
    )

    // if no previously saved engageHeight, autopopulate with recommended value
    // recommended value is null when no labware found on module
    const engageHeight = prevEngageHeight || stringDefaultEngageHeight
    formData = { ...formData, moduleId, magnetAction, engageHeight }
  }

  return formData
}
