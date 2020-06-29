// @flow
import type { DeckSlotId, ModuleRealType } from '@opentrons/shared-data'
import {
  getPipetteNameSpecs,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import assert from 'assert'
import find from 'lodash/find'
import reduce from 'lodash/reduce'
import values from 'lodash/values'

import {
  GEN_ONE_MULTI_PIPETTES,
  SPAN7_8_10_11_SLOT,
  TC_SPAN_SLOTS,
} from '../../constants'
import type { LabwareDefByDefURI } from '../../labware-defs'
import type { DeckSlot } from '../../types'
import type {
  FormPipette,
  FormPipettesByMount,
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
  NormalizedPipette,
  NormalizedPipetteById,
  PipetteEntities,
  PipetteEntity,
} from '../types'

export { createPresavedStepForm } from './createPresavedStepForm'

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
