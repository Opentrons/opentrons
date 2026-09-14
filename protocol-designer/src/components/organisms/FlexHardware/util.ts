import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getAAWithFakesFromCutoutFixtureId,
  getAddedMissingThermocyclerFixtures,
  getComboFixtureFromFixtureIds,
  getCutoutFixturesForModuleModel,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getMainFixtureIdForAA,
  getModuleModelFromFixtureId,
  getModuleType,
  getSlotDisplayNameFromAAWithFakes,
  isModuleFixtureId,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_FIXTURES,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  VACUUM_MODULE_V1,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { deleteModule } from '/protocol-designer/modules'
import {
  createModule,
  editDeckConfiguration,
} from '/protocol-designer/step-forms/actions'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '/protocol-designer/step-forms/actions/additionalItems'

import { getLabwareNotCompatibleWithModule, getSlotHasLabware } from '../utils'
import { getHardwareInSlotInUse } from './getHardwareInSlotInUse'

import type { Dispatch, SetStateAction } from 'react'
import type {
  AddressableAreaName,
  CutoutConfigMap,
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
  DeckDefinition,
} from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
  LabwareOnDeck,
  ModuleOnDeck,
  SavedStepFormState,
} from '/protocol-designer/step-forms'
import type { DeckFixture } from '/protocol-designer/step-forms/actions/additionalItems'
import type { AdditionalEquipmentOnDeck } from '/protocol-designer/step-forms/types'
import type { ThunkDispatch } from '/protocol-designer/types'
import type { MakeSnackbar } from '../Kitchen/KitchenContext'

interface UpdateInitialDeckSetupProps {
  values: CutoutConfigMap[]
  initialDeckSetup: AllTemporalPropertiesForTimelineFrame
  dispatch: ThunkDispatch<any>
  setShowDeleteEntityModal: Dispatch<
    SetStateAction<{
      ids: string[]
      deckConfig: DeckConfiguration
    } | null>
  >
  setShowDeleteStagingAreaModal: Dispatch<
    SetStateAction<{
      ids: string[]
      deckConfig: DeckConfiguration
    } | null>
  >
  savedSteps: SavedStepFormState
  makeSnackbar: MakeSnackbar
  t: any
  handleDeleteStackerLabware: (module: ModuleOnDeck) => void
  deckConfig?: DeckConfiguration
}

interface fixtureEntry {
  cutoutConfigMap: CutoutConfigMap
  newFixtureName: CutoutFixtureId
  matchingFixture: AdditionalEquipmentOnDeck | undefined
  hasLabwareOnSlot: boolean
  onDeckFixtureIds: string[] | null
  labwareInFourthColumnSlot: {
    id: string | null
    inUse: boolean
  }
  deckConfig?: DeckConfiguration
  dispatch: ThunkDispatch<any>
  setShowDeleteEntityModal: UpdateInitialDeckSetupProps['setShowDeleteEntityModal']
  setShowDeleteStagingAreaModal: UpdateInitialDeckSetupProps['setShowDeleteStagingAreaModal']
  makeSnackbar: MakeSnackbar
  t: any
}

interface ModuleEntry {
  cutoutConfigMap: CutoutConfigMap
  matchingModule: ModuleOnDeck | undefined
  moduleId: string | null
  labwareOnDeck: AllTemporalPropertiesForTimelineFrame['labware']
  deckConfig?: DeckConfiguration
  dispatch: ThunkDispatch<any>
  setShowDeleteEntityModal: UpdateInitialDeckSetupProps['setShowDeleteEntityModal']
  makeSnackbar: MakeSnackbar
  t: any
}

/** What the protocol wants for this cutout fixture. */
interface CutoutFixtureTarget {
  newFixtureName: CutoutFixtureId | null
  removing: boolean
  isModuleFixture: boolean
}

/** What's on deck at this cutout and in-use state. */
interface CutoutDeckState {
  matchingFixturesOnDeck: AdditionalEquipmentOnDeck[]
  matchingFixtureOnDeck: AdditionalEquipmentOnDeck | null
  isWasteChuteStagingAreaCombo: boolean
  matchingModuleOnDeck: ModuleOnDeck | undefined
  modulesAtCutout: ModuleOnDeck[]
  matching4thColumnLabware: LabwareOnDeck | null
  labwareInFourthColumnSlot: { id: string | null; inUse: boolean }
  moduleId: string | null
  fixtureIds: string[] | null
  hasLabwareOnSlot: boolean
}

/** Gathered state for one cutout when syncing deck to protocol. */
interface CutoutFixtureState extends CutoutFixtureTarget, CutoutDeckState {
  cutoutConfigMap: CutoutConfigMap
}

function getCutoutFixtureTargetFromCutoutConfigMap(
  cutoutConfigMap: CutoutConfigMap
): CutoutFixtureTarget {
  const newFixtureName = getMainFixtureIdForAA(
    [cutoutConfigMap.cutoutFixtureId as CutoutFixtureId],
    [cutoutConfigMap.addressableAreaId as AddressableAreaName],
    cutoutConfigMap.cutoutId
  )
  return {
    newFixtureName,
    removing: SINGLE_SLOT_FIXTURES.includes(newFixtureName!),
    isModuleFixture: isModuleFixtureId(newFixtureName!),
  }
}

function getCutoutDeckState(
  cutoutConfigMap: CutoutConfigMap,
  deckDef: DeckDefinition,
  additionalEquipmentOnDeck: Record<string, AdditionalEquipmentOnDeck>,
  moduleOnDeck: Record<string, ModuleOnDeck>,
  labwareOnDeck: Record<string, LabwareOnDeck>,
  savedSteps: SavedStepFormState
): CutoutDeckState {
  const matchingFixturesOnDeck = Object.values(
    additionalEquipmentOnDeck
  ).filter(ae => ae.location === cutoutConfigMap.cutoutId)
  const matchingFixtureOnDeck = matchingFixturesOnDeck[0] ?? null
  const matchingModuleOnDeck = Object.values(moduleOnDeck).find(
    m => getCutoutIdForSlotName(m.slot, deckDef) === cutoutConfigMap.cutoutId
  )
  const modulesAtCutout = Object.values(moduleOnDeck).filter(
    m => getCutoutIdForSlotName(m.slot, deckDef) === cutoutConfigMap.cutoutId
  )
  const matchingStagingArea = matchingFixturesOnDeck.find(
    f => f.name === 'stagingArea'
  )
  const stagingAreaSlots =
    matchingStagingArea != null && matchingStagingArea.location != null
      ? getAAWithFakesFromCutoutFixtureId(
          matchingStagingArea.location as CutoutId,
          STAGING_AREA_RIGHT_SLOT_FIXTURE as CutoutFixtureId,
          deckDef
        )
      : null
  const matching4thColumnLabware =
    stagingAreaSlots != null && stagingAreaSlots.length > 0
      ? (Object.values(labwareOnDeck).find(lw =>
          stagingAreaSlots.some(slot => lw.stack.includes(slot))
        ) ?? null)
      : null
  const { moduleId, fixtureIds, fourthColumnSlotLabwareId } =
    getHardwareInSlotInUse(
      savedSteps,
      matching4thColumnLabware,
      matchingModuleOnDeck,
      matchingFixturesOnDeck.length > 0 ? matchingFixturesOnDeck : undefined
    )
  const labwareInFourthColumnSlot = {
    id: matching4thColumnLabware?.id ?? null,
    inUse: fourthColumnSlotLabwareId != null,
  }
  const hasLabwareOnSlot = getSlotHasLabware(
    labwareOnDeck,
    cutoutConfigMap.cutoutId
  )
  return {
    matchingFixturesOnDeck,
    matchingFixtureOnDeck,
    isWasteChuteStagingAreaCombo: matchingFixturesOnDeck.length > 1,
    matchingModuleOnDeck,
    modulesAtCutout,
    matching4thColumnLabware,
    labwareInFourthColumnSlot,
    moduleId,
    fixtureIds,
    hasLabwareOnSlot,
  }
}

function getCutoutFixtureState(
  cutoutConfigMap: CutoutConfigMap,
  deckDef: DeckDefinition,
  additionalEquipmentOnDeck: Record<string, AdditionalEquipmentOnDeck>,
  moduleOnDeck: Record<string, ModuleOnDeck>,
  labwareOnDeck: Record<string, LabwareOnDeck>,
  savedSteps: SavedStepFormState
): CutoutFixtureState {
  return {
    cutoutConfigMap: cutoutConfigMap,
    ...getCutoutFixtureTargetFromCutoutConfigMap(cutoutConfigMap),
    ...getCutoutDeckState(
      cutoutConfigMap,
      deckDef,
      additionalEquipmentOnDeck,
      moduleOnDeck,
      labwareOnDeck,
      savedSteps
    ),
  }
}

function toFixtureEntry(
  state: CutoutFixtureState,
  props: UpdateInitialDeckSetupProps,
  overrides: Partial<fixtureEntry> = {}
): fixtureEntry {
  return {
    cutoutConfigMap: state.cutoutConfigMap,
    newFixtureName: state.newFixtureName!,
    matchingFixture:
      overrides.matchingFixture ?? state.matchingFixtureOnDeck ?? undefined,
    hasLabwareOnSlot: state.hasLabwareOnSlot,
    onDeckFixtureIds: state.fixtureIds,
    labwareInFourthColumnSlot: state.labwareInFourthColumnSlot,
    deckConfig: props.deckConfig,
    dispatch: props.dispatch,
    setShowDeleteEntityModal: props.setShowDeleteEntityModal,
    setShowDeleteStagingAreaModal: props.setShowDeleteStagingAreaModal,
    makeSnackbar: props.makeSnackbar,
    t: props.t,
    ...overrides,
  }
}

function toModuleEntry(
  state: CutoutFixtureState,
  props: UpdateInitialDeckSetupProps,
  overrides: Partial<ModuleEntry> = {}
): ModuleEntry {
  return {
    cutoutConfigMap: state.cutoutConfigMap,
    matchingModule: overrides.matchingModule ?? state.matchingModuleOnDeck,
    moduleId: overrides.moduleId ?? state.moduleId,
    labwareOnDeck: props.initialDeckSetup.labware,
    deckConfig: props.deckConfig,
    dispatch: props.dispatch,
    setShowDeleteEntityModal: props.setShowDeleteEntityModal,
    makeSnackbar: props.makeSnackbar,
    t: props.t,
    ...overrides,
  }
}

/** Special case: removing one fixture from waste chute + staging area combo. */
function handleWasteChuteStagingAreaComboRemoval(
  state: CutoutFixtureState,
  props: UpdateInitialDeckSetupProps
): void {
  const targetFixtureName = WASTE_CHUTE_FIXTURES.includes(state.newFixtureName!)
    ? 'stagingArea'
    : STAGING_AREA_FIXTURES.includes(state.newFixtureName!)
      ? 'wasteChute'
      : null
  const fixtureToDelete =
    targetFixtureName != null
      ? state.matchingFixturesOnDeck.find(f => f.name === targetFixtureName)
      : state.matchingFixtureOnDeck
  if (fixtureToDelete == null) return
  handleDeleteFixture(
    toFixtureEntry(state, props, { matchingFixture: fixtureToDelete })
  )
}

/** Special case: removing one module from 2-module combo (e.g. flex stacker + mag block). */
function handleTwoModulesComboRemoval(
  state: CutoutFixtureState,
  props: UpdateInitialDeckSetupProps
): void {
  const moduleToDelete = state.modulesAtCutout.find(
    m => m.model !== getModuleModelFromFixtureId(state.newFixtureName!)
  )
  if (moduleToDelete == null) return
  const { moduleId: moduleToDeleteId } = getHardwareInSlotInUse(
    props.savedSteps,
    state.matching4thColumnLabware,
    moduleToDelete,
    undefined
  )
  handleDeleteModule(
    toModuleEntry(state, props, {
      matchingModule: moduleToDelete,
      moduleId: moduleToDeleteId,
    }),
    props.handleDeleteStackerLabware
  )
}

/** Generic removing: delete module or single fixture at this cutout. */
function processRemoving(
  state: CutoutFixtureState,
  props: UpdateInitialDeckSetupProps
): void {
  if (state.matchingModuleOnDeck != null) {
    handleDeleteModule(
      toModuleEntry(state, props),
      props.handleDeleteStackerLabware
    )
  } else if (state.matchingFixturesOnDeck.length > 0) {
    handleDeleteFixture(toFixtureEntry(state, props))
  }
}

/** Adding path: fixture or module, with combo special cases. */
function processAdding(
  state: CutoutFixtureState,
  props: UpdateInitialDeckSetupProps,
  deckDef: DeckDefinition
): void {
  const {
    cutoutConfigMap: value,
    newFixtureName,
    matchingModuleOnDeck,
    matchingFixtureOnDeck,
    isModuleFixture,
  } = state
  const moduleEntry = toModuleEntry(state, props)
  const fixtureEntry = toFixtureEntry(state, props)

  if (!isModuleFixture && newFixtureName != null) {
    // —— Adding fixture ——
    if (matchingModuleOnDeck != null && matchingFixtureOnDeck != null) {
      handleDeleteModule(moduleEntry, props.handleDeleteStackerLabware)
    } else if (matchingFixtureOnDeck != null) {
      const isAddingWasteChuteToStagingArea =
        WASTE_CHUTE_FIXTURES.includes(newFixtureName) &&
        matchingFixtureOnDeck.name === 'stagingArea'
      const isAddingStagingAreaToWasteChute =
        STAGING_AREA_FIXTURES.includes(newFixtureName) &&
        matchingFixtureOnDeck.name === 'wasteChute'
      if (isAddingWasteChuteToStagingArea || isAddingStagingAreaToWasteChute) {
        handleCreateFixture(fixtureEntry)
      } else {
        handleDeleteFixture(fixtureEntry)
      }
    } else {
      handleCreateFixture(fixtureEntry)
    }
  } else {
    // —— Adding module ——
    if (matchingModuleOnDeck != null && matchingFixtureOnDeck != null) {
      handleDeleteFixture(fixtureEntry)
    } else if (matchingModuleOnDeck != null) {
      const moduleOnDeckFixtureId = getCutoutFixturesForModuleModel(
        matchingModuleOnDeck.model,
        deckDef
      )
      const comboFixtureId = getComboFixtureFromFixtureIds([
        moduleOnDeckFixtureId[0].id as CutoutFixtureId,
        newFixtureName ?? value.cutoutFixtureId,
      ])
      if (comboFixtureId != null) {
        handleCreateModule({
          ...moduleEntry,
          cutoutConfigMap: {
            ...value,
            cutoutFixtureId: newFixtureName ?? value.cutoutFixtureId,
          },
        })
      } else {
        handleDeleteModule(moduleEntry, props.handleDeleteStackerLabware)
      }
    } else {
      handleCreateModule(moduleEntry)
    }
  }
}

const handleDeleteFixture = (ctx: fixtureEntry): void => {
  const {
    matchingFixture,
    onDeckFixtureIds: fixtureIds,
    labwareInFourthColumnSlot,
    deckConfig,
    dispatch,
    setShowDeleteEntityModal,
    setShowDeleteStagingAreaModal,
  } = ctx

  if (matchingFixture == null) return

  // Deleting staging area with labware in 4th column slot
  if (
    matchingFixture.name === 'stagingArea' &&
    fixtureIds == null &&
    labwareInFourthColumnSlot.id != null &&
    deckConfig != null
  ) {
    setShowDeleteStagingAreaModal({
      ids: [labwareInFourthColumnSlot.id, matchingFixture.id],
      deckConfig,
    })
    return
  }

  // Deleting fixture that is in use
  if (fixtureIds != null && deckConfig != null) {
    const ids =
      labwareInFourthColumnSlot.inUse != null
        ? [...fixtureIds, labwareInFourthColumnSlot.id ?? '']
        : fixtureIds
    setShowDeleteEntityModal({ ids, deckConfig })
    return
  }

  // Deleting fixture that is not in use
  dispatch(deleteDeckFixture(matchingFixture.id))
  if (deckConfig != null) {
    dispatch(editDeckConfiguration({ deckConfig }))
  }
}

const handleCreateFixture = (ctx: fixtureEntry): void => {
  const {
    cutoutConfigMap: value,
    newFixtureName: fixtureName,
    hasLabwareOnSlot,
    dispatch,
    makeSnackbar,
    t,
  } = ctx

  // Block creating trashBin or wasteChute if there is labware on the slot
  if (
    hasLabwareOnSlot &&
    (fixtureName === TRASH_BIN_ADAPTER_FIXTURE ||
      fixtureName in WASTE_CHUTE_FIXTURES)
  ) {
    makeSnackbar(t('conflict_on_slot_labware_fixture') as string)
    return
  }

  dispatch(
    createDeckFixture(
      mapFixtureIdToFixtureName(fixtureName) as DeckFixture,
      value.cutoutId
    )
  )
}

const handleDeleteModule = (
  ctx: ModuleEntry,
  handleDeleteStackerLabware: (module: ModuleOnDeck) => void
): void => {
  const {
    matchingModule,
    moduleId,
    deckConfig,
    dispatch,
    setShowDeleteEntityModal,
  } = ctx

  if (matchingModule == null) return

  // Module is in use
  if (moduleId != null && deckConfig != null) {
    setShowDeleteEntityModal({ ids: [moduleId], deckConfig })
    return
  }

  // Delete module not in use
  dispatch(deleteModule({ moduleId: matchingModule.id }))
  if (matchingModule.type === FLEX_STACKER_MODULE_TYPE) {
    handleDeleteStackerLabware(matchingModule)
  }
  if (deckConfig != null) {
    dispatch(editDeckConfiguration({ deckConfig }))
  }
}

const handleCreateModule = (ctx: ModuleEntry): void => {
  const {
    cutoutConfigMap: value,
    labwareOnDeck,
    dispatch,
    makeSnackbar,
    t,
  } = ctx

  const model = getModuleModelFromFixtureId(
    value.cutoutFixtureId as CutoutFixtureId
  )
  if (model == null) return

  const type = getModuleType(model)

  // Skip creating module for thermocycler rear fixture - only create once via front fixture
  if (
    type === THERMOCYCLER_MODULE_TYPE &&
    value.cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE
  ) {
    return
  }

  const labwareNotCompatible = getLabwareNotCompatibleWithModule(
    type,
    labwareOnDeck,
    value.cutoutId
  )

  if (labwareNotCompatible != null) {
    makeSnackbar(
      t('module_incompatible', { slot: labwareNotCompatible }) as string
    )
    return
  }

  let slot: string = getSlotDisplayNameFromAAWithFakes(value.addressableAreaId)
  // hard code override for Vacuum slot since we allow UI selection in A3 OR A4
  if (model === VACUUM_MODULE_V1) {
    slot = 'A3'
  }
  dispatch(createModule({ slot, model, type }))
}

export const updateInitialDeckState = (
  props: UpdateInitialDeckSetupProps
): void => {
  const { values, initialDeckSetup, savedSteps } = props

  const {
    additionalEquipmentOnDeck,
    modules: moduleOnDeck,
    labware: labwareOnDeck,
  } = initialDeckSetup
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  const allValues = getAddedMissingThermocyclerFixtures(values, deckDef)

  allValues.forEach(value => {
    const cutoutFixtureState = getCutoutFixtureState(
      value,
      deckDef,
      additionalEquipmentOnDeck,
      moduleOnDeck,
      labwareOnDeck,
      savedSteps
    )

    // Special cases removal from waste chute + staging area combo
    if (cutoutFixtureState.isWasteChuteStagingAreaCombo) {
      handleWasteChuteStagingAreaComboRemoval(cutoutFixtureState, props)
      return
    }
    if (cutoutFixtureState.modulesAtCutout.length === 2) {
      handleTwoModulesComboRemoval(cutoutFixtureState, props)
      return
    }

    // Removing: single-slot fixture → delete module or fixture at this cutout
    if (cutoutFixtureState.removing) {
      processRemoving(cutoutFixtureState, props)
      return
    }

    // Adding: create or replace fixture/module (with combo special cases inside)
    processAdding(cutoutFixtureState, props, deckDef)
  })
}

export function mapFixtureIdToFixtureName(
  fixtureId: CutoutFixtureId | null
): string | null {
  if (fixtureId == null) return null
  if (fixtureId === TRASH_BIN_ADAPTER_FIXTURE) {
    return 'trashBin'
  } else if (WASTE_CHUTE_FIXTURES.includes(fixtureId)) {
    return 'wasteChute'
  } else if (STAGING_AREA_FIXTURES.includes(fixtureId)) {
    return 'stagingArea'
  } else {
    return null
  }
}
