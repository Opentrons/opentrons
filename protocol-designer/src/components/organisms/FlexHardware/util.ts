import {
  FLEX_ROBOT_TYPE,
  getAddedMissingThermocyclerFixtures,
  getCutoutFixturesForModuleModel,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getMainFixtureIdForAA,
  getModuleModelFromFixtureId,
  getModuleType,
  getSlotDisplayNameFromAAWithFakes,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_FIXTURES,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
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
  DeckConfiguration,
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
  deckConfig?: DeckConfiguration
}

interface FixtureContext {
  value: CutoutConfigMap
  fixtureName: CutoutFixtureId
  matchingFixture: AdditionalEquipmentOnDeck | undefined
  matching4thColumnLabware: LabwareOnDeck | null
  hasLabwareOnSlot: boolean
  fixtureIds: string[] | null
  fourthColumnSlotLabwareId: string | null
  deckConfig?: DeckConfiguration
  dispatch: ThunkDispatch<any>
  setShowDeleteEntityModal: UpdateInitialDeckSetupProps['setShowDeleteEntityModal']
  setShowDeleteStagingAreaModal: UpdateInitialDeckSetupProps['setShowDeleteStagingAreaModal']
  makeSnackbar: MakeSnackbar
  t: any
}

interface ModuleContext {
  value: CutoutConfigMap
  matchingModule: ModuleOnDeck | undefined
  moduleId: string | null
  labwareOnDeck: AllTemporalPropertiesForTimelineFrame['labware']
  deckConfig?: DeckConfiguration
  dispatch: ThunkDispatch<any>
  setShowDeleteEntityModal: UpdateInitialDeckSetupProps['setShowDeleteEntityModal']
  makeSnackbar: MakeSnackbar
  t: any
}

const handleDeleteFixture = (ctx: FixtureContext): void => {
  const {
    matchingFixture,
    matching4thColumnLabware,
    fixtureIds,
    fourthColumnSlotLabwareId,
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
    matching4thColumnLabware != null &&
    deckConfig != null
  ) {
    setShowDeleteStagingAreaModal({
      ids: [matching4thColumnLabware.id, matchingFixture.id],
      deckConfig,
    })
    return
  }

  // Deleting fixture that is in use
  if (fixtureIds != null && deckConfig != null) {
    const ids =
      fourthColumnSlotLabwareId != null
        ? [...fixtureIds, fourthColumnSlotLabwareId]
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

const handleCreateFixture = (ctx: FixtureContext): void => {
  const { value, fixtureName, hasLabwareOnSlot, dispatch, makeSnackbar, t } =
    ctx

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

const handleDeleteModule = (ctx: ModuleContext): void => {
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
  if (deckConfig != null) {
    dispatch(editDeckConfiguration({ deckConfig }))
  }
}

const handleCreateModule = (ctx: ModuleContext): void => {
  console.log('handleCreateModule: ', ctx)
  const { value, labwareOnDeck, dispatch, makeSnackbar, t } = ctx

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

  const slot = getSlotDisplayNameFromAAWithFakes(value.addressableAreaId)
  dispatch(createModule({ slot, model, type }))
}

export const updateInitialDeckState = (
  props: UpdateInitialDeckSetupProps
): void => {
  const {
    values,
    initialDeckSetup,
    dispatch,
    setShowDeleteEntityModal,
    setShowDeleteStagingAreaModal,
    savedSteps,
    makeSnackbar,
    t,
    deckConfig,
  } = props

  console.log('values: ', values)
  const {
    additionalEquipmentOnDeck,
    modules: moduleOnDeck,
    labware: labwareOnDeck,
  } = initialDeckSetup
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  // Add missing thermocycler fixtures if needed
  const allValues = getAddedMissingThermocyclerFixtures(values, deckDef)

  console.log('additionalEquipmentOnDeck: ', additionalEquipmentOnDeck)
  allValues.forEach(value => {
    const newFixtureName = getMainFixtureIdForAA(
      [value.cutoutFixtureId as CutoutFixtureId],
      [value.addressableAreaId as AddressableAreaName],
      value.cutoutId
    )

    // Determine if we're removing (applying single slot fixture) or adding
    const removing = SINGLE_SLOT_FIXTURES.includes(
      newFixtureName as CutoutFixtureId
    )

    // Get current state at this cutout
    const currentDeckConfigItem = deckConfig?.find(
      config => config.cutoutId === value.cutoutId
    )
    const currentModuleModel = getModuleModelFromFixtureId(
      currentDeckConfigItem?.cutoutFixtureId as CutoutFixtureId
    )

    // Determine if the new fixture is a module
    const isModuleFixture =
      getModuleModelFromFixtureId(newFixtureName as CutoutFixtureId) !== null

    // Find matching fixture on deck
    const matchingFixtureOnDeck = Object.values(additionalEquipmentOnDeck).find(
      ae => ae.location === value.cutoutId
    )
    const matchingModuleOnDeck = Object.values(moduleOnDeck).find(
      module =>
        getCutoutIdForSlotName(module.slot, deckDef) === value.cutoutId &&
        currentModuleModel === module.model
    )

    const slotName = getSlotDisplayNameFromAAWithFakes(value.addressableAreaId)
    const matching4thColumnLabware =
      matchingFixtureOnDeck?.name === 'stagingArea' && slotName != null
        ? (Object.values(labwareOnDeck).find(lw =>
            lw.stack.includes(slotName)
          ) ?? null)
        : null

    const { moduleId, fixtureIds, fourthColumnSlotLabwareId } =
      getHardwareInSlotInUse(
        savedSteps,
        matching4thColumnLabware,
        matchingModuleOnDeck,
        matchingFixtureOnDeck != null ? [matchingFixtureOnDeck] : undefined
      )

    const hasLabwareOnSlot = getSlotHasLabware(labwareOnDeck, value.cutoutId)

    // Decision logic based on removing flag and fixture type
    if (removing) {
      // Removing: delete existing module or fixture
      if (currentModuleModel != null && matchingModuleOnDeck != null) {
        // Delete module
        const moduleCtx: ModuleContext = {
          value,
          matchingModule: matchingModuleOnDeck,
          moduleId,
          labwareOnDeck,
          deckConfig,
          dispatch,
          setShowDeleteEntityModal,
          makeSnackbar,
          t,
        }
        handleDeleteModule(moduleCtx)
      } else if (matchingFixtureOnDeck != null) {
        // Delete fixture
        const fixtureCtx: FixtureContext = {
          value,
          fixtureName: newFixtureName as CutoutFixtureId,
          matchingFixture: matchingFixtureOnDeck,
          matching4thColumnLabware,
          hasLabwareOnSlot,
          fixtureIds,
          fourthColumnSlotLabwareId,
          deckConfig,
          dispatch,
          setShowDeleteEntityModal,
          setShowDeleteStagingAreaModal,
          makeSnackbar,
          t,
        }
        handleDeleteFixture(fixtureCtx)
      }
      return
    }

    // Adding: create new module or fixture
    if (!isModuleFixture && newFixtureName != null) {
      // Create fixture
      const fixtureCtx: FixtureContext = {
        value,
        fixtureName: newFixtureName,
        matchingFixture: matchingFixtureOnDeck,
        matching4thColumnLabware,
        hasLabwareOnSlot,
        fixtureIds,
        fourthColumnSlotLabwareId,
        deckConfig,
        dispatch,
        setShowDeleteEntityModal,
        setShowDeleteStagingAreaModal,
        makeSnackbar,
        t,
      }
      handleCreateFixture(fixtureCtx)
      return
    }

    // Handle modules (isModuleFixture is true at this point)
    const moduleCtx: ModuleContext = {
      value,
      matchingModule: matchingModuleOnDeck,
      moduleId,
      labwareOnDeck,
      deckConfig,
      dispatch,
      setShowDeleteEntityModal,
      makeSnackbar,
      t,
    }

    if (matchingModuleOnDeck != null) {
      // Replace existing module - delete first
      handleDeleteModule(moduleCtx)
    } else {
      // Create new module
      handleCreateModule(moduleCtx)
    }
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
