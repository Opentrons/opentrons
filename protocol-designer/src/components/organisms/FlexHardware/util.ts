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
} from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
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
    handleDeleteStackerLabware,
  } = props

  const {
    additionalEquipmentOnDeck,
    modules: moduleOnDeck,
    labware: labwareOnDeck,
  } = initialDeckSetup
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  // Add missing thermocycler fixtures if needed
  const allValues = getAddedMissingThermocyclerFixtures(values, deckDef)

  allValues.forEach(value => {
    const newFixtureName = getMainFixtureIdForAA(
      [value.cutoutFixtureId as CutoutFixtureId],
      [value.addressableAreaId as AddressableAreaName],
      value.cutoutId
    )
    // Find matching fixtures on deck by cutoutId (could be multiple, e.g., waste chute + staging area)
    const matchingFixturesOnDeck = Object.values(
      additionalEquipmentOnDeck
    ).filter(ae => ae.location === value.cutoutId)
    // Check if this is a waste chute + staging area combo (multiple fixtures at same cutout)
    const isWasteChuteStagingAreaCombo = matchingFixturesOnDeck.length > 1
    const matchingFixtureOnDeck = matchingFixturesOnDeck[0] ?? null

    // Determine if we're removing (applying single slot fixture) or adding
    const removing = SINGLE_SLOT_FIXTURES.includes(newFixtureName!)
    // Determine if the new fixture is a module (including combo fixtures that contain a module)
    const isModuleFixture = isModuleFixtureId(newFixtureName!)
    const matchingModuleOnDeck = Object.values(moduleOnDeck).find(
      module => getCutoutIdForSlotName(module.slot, deckDef) === value.cutoutId
    )
    const modulesAtCutout = Object.values(moduleOnDeck).filter(
      module => getCutoutIdForSlotName(module.slot, deckDef) === value.cutoutId
    )

    const matchingStagingArea = matchingFixturesOnDeck.find(
      f => f.name === 'stagingArea'
    )
    // Get the addressable area IDs for the staging area slot (e.g., ['D4', 'fakeD4'] for cutoutD3)
    const stagingAreaSlots =
      matchingStagingArea != null && matchingStagingArea.location != null
        ? getAAWithFakesFromCutoutFixtureId(
            matchingStagingArea.location as CutoutId,
            STAGING_AREA_RIGHT_SLOT_FIXTURE as CutoutFixtureId,
            deckDef
          )
        : null

    // Check if there's labware on any of the staging area slots
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
      id: matching4thColumnLabware?.id,
      inUse: fourthColumnSlotLabwareId != null,
    }

    const hasLabwareOnSlot = getSlotHasLabware(labwareOnDeck, value.cutoutId)

    // Handle waste chute + staging area combo - treat as remove
    if (isWasteChuteStagingAreaCombo) {
      // Determine which fixture to delete based on newFixtureName (delete the opposite)
      // If newFixtureName is waste chute, delete staging area (keep waste chute)
      // If newFixtureName is staging area, delete waste chute (keep staging area)
      const targetFixtureName = WASTE_CHUTE_FIXTURES.includes(newFixtureName!)
        ? 'stagingArea'
        : STAGING_AREA_FIXTURES.includes(newFixtureName!)
          ? 'wasteChute'
          : null
      const fixtureToDelete =
        targetFixtureName != null
          ? matchingFixturesOnDeck.find(f => f.name === targetFixtureName)
          : matchingFixtureOnDeck

      if (fixtureToDelete != null) {
        const fixtureCtx: fixtureEntry = {
          cutoutConfigMap: value,
          newFixtureName: newFixtureName!,
          matchingFixture: fixtureToDelete,
          hasLabwareOnSlot,
          onDeckFixtureIds: fixtureIds,
          labwareInFourthColumnSlot,
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

    // Handle flex stacker + mag block combo (2 modules in same slot) - remove the module that is not newFixtureName
    if (modulesAtCutout.length === 2) {
      const moduleToDelete = modulesAtCutout.find(
        m => m.model !== getModuleModelFromFixtureId(newFixtureName!)
      )
      if (moduleToDelete != null) {
        const { moduleId: moduleToDeleteId } = getHardwareInSlotInUse(
          savedSteps,
          matching4thColumnLabware,
          moduleToDelete,
          undefined
        )
        const moduleCtx: ModuleEntry = {
          cutoutConfigMap: value,
          matchingModule: moduleToDelete,
          moduleId: moduleToDeleteId,
          labwareOnDeck,
          deckConfig,
          dispatch,
          setShowDeleteEntityModal,
          makeSnackbar,
          t,
        }
        handleDeleteModule(moduleCtx, handleDeleteStackerLabware)
      }
      return
    }

    if (removing) {
      if (matchingModuleOnDeck != null) {
        const moduleCtx: ModuleEntry = {
          cutoutConfigMap: value,
          matchingModule: matchingModuleOnDeck,
          moduleId,
          labwareOnDeck,
          deckConfig,
          dispatch,
          setShowDeleteEntityModal,
          makeSnackbar,
          t,
        }
        handleDeleteModule(moduleCtx, handleDeleteStackerLabware)
      } else if (matchingFixturesOnDeck.length > 0) {
        const fixtureCtx: fixtureEntry = {
          cutoutConfigMap: value,
          newFixtureName: newFixtureName!,
          matchingFixture: matchingFixtureOnDeck,
          hasLabwareOnSlot,
          onDeckFixtureIds: fixtureIds,
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

    const moduleCtx: ModuleEntry = {
      cutoutConfigMap: value,
      matchingModule: matchingModuleOnDeck,
      moduleId,
      labwareOnDeck,
      deckConfig,
      dispatch,
      setShowDeleteEntityModal,
      makeSnackbar,
      t,
    }
    const fixtureCtx: fixtureEntry = {
      cutoutConfigMap: value,
      newFixtureName: newFixtureName!,
      matchingFixture: matchingFixtureOnDeck,
      hasLabwareOnSlot,
      onDeckFixtureIds: fixtureIds,
      fourthColumnSlotLabwareId,
      deckConfig,
      dispatch,
      setShowDeleteEntityModal,
      setShowDeleteStagingAreaModal,
      makeSnackbar,
      t,
    }

    if (!isModuleFixture && newFixtureName != null) {
      // Adding fixture
      if (matchingModuleOnDeck != null && matchingFixtureOnDeck != null) {
        handleDeleteModule(moduleCtx, handleDeleteStackerLabware)
      } else if (matchingFixtureOnDeck != null) {
        // Check if this is a waste chute + staging area combo case
        // If adding waste chute to staging area OR adding staging area to waste chute, keep both for combo
        const isAddingWasteChuteToStagingArea =
          WASTE_CHUTE_FIXTURES.includes(newFixtureName!) &&
          matchingFixtureOnDeck.name === 'stagingArea'
        const isAddingStagingAreaToWasteChute =
          STAGING_AREA_FIXTURES.includes(newFixtureName!) &&
          matchingFixtureOnDeck.name === 'wasteChute'

        if (
          isAddingWasteChuteToStagingArea ||
          isAddingStagingAreaToWasteChute
        ) {
          // Keep existing fixture and create the new one for combo
          handleCreateFixture(fixtureCtx)
        } else {
          // Replace existing fixture
          handleDeleteFixture(fixtureCtx)
        }
      } else {
        handleCreateFixture(fixtureCtx)
      }
    } else {
      // Adding module
      if (matchingModuleOnDeck != null && matchingFixtureOnDeck != null) {
        handleDeleteFixture(fixtureCtx)
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
            ...moduleCtx,
            cutoutConfigMap: {
              ...value,
              cutoutFixtureId: newFixtureName ?? value.cutoutFixtureId,
            },
          })
        } else {
          handleDeleteModule(moduleCtx, handleDeleteStackerLabware)
        }
      } else {
        handleCreateModule(moduleCtx)
      }
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
