import mapValues from 'lodash/mapValues'
import { createSelector } from 'reselect'

import {
  FLEX_MODULE_ADDRESSABLE_AREAS,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_ADDRESSABLE_AREAS,
  FLEX_STACKER_MODULE_TYPE,
  getDeckDefFromRobotType,
  getModuleDisplayName,
  isAddressableAreaStandardSlot,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA,
  VACUUM_MODULE_TYPE,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import {
  COLUMN_4_SLOTS,
  getAllLargestStacks,
  getProvidedAddressableAreasExposed,
  getSlotInLocationStack,
  getTopLocationInStack,
} from '@opentrons/step-generation'

import { OFFDECK, VACUUM_DOCK_DISPLAY_LOCATION } from '../../constants'
import { selectors as fileDataSelectors } from '../../file-data'
import { getRobotType } from '../../file-data/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
  getLabwareEntities,
  getModuleEntities,
} from '../../step-forms/selectors'
import {
  END_TERMINAL_ITEM_ID,
  HARDWARE_ID,
  PRESAVED_STEP_ID,
  START_TERMINAL_ITEM_ID,
} from '../../steplist'
import { getActiveItem, getSelectedStepId } from '../../ui/steps'
import { TERMINAL_ITEM_SELECTION_TYPE } from '../../ui/steps/reducers'
import { getSelectedTerminalItemId } from '../../ui/steps/selectors'
import { getIsAdapter } from '../../utils'

import type {
  AddressableAreaName,
  CutoutId,
  LoadedLabwareLocation,
} from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  RobotState,
} from '@opentrons/step-generation'
import type { AllTemporalPropertiesForTimelineFrame } from '../../step-forms'
import type { Selector } from '../../types'

export interface Option {
  name: string
  value: string
  deckLabel: string
}

export const getRobotStateAtActiveItem: Selector<RobotState | null> =
  createSelector(
    stepFormSelectors.getOrderedStepIds,
    fileDataSelectors.getRobotStateTimeline,
    getActiveItem,
    fileDataSelectors.getInitialRobotState,
    fileDataSelectors.lastValidRobotState,
    getSelectedStepId,
    getSelectedTerminalItemId,
    (
      orderedStepIds,
      robotStateTimeline,
      activeItem,
      initialRobotState,
      lastValidRobotState,
      selectedStepId,
      selectedTerminalItemId
    ) => {
      let robotState = null
      if (activeItem == null) return null

      if (
        activeItem.selectionType === TERMINAL_ITEM_SELECTION_TYPE &&
        activeItem.id !== HARDWARE_ID
      ) {
        const terminalId = activeItem.id

        if (terminalId === START_TERMINAL_ITEM_ID) {
          robotState = initialRobotState
        } else if (
          terminalId === END_TERMINAL_ITEM_ID ||
          terminalId === PRESAVED_STEP_ID
        ) {
          robotState = lastValidRobotState
        } else {
          console.error(
            `Invalid terminalId ${terminalId}, could not robotState of active item`
          )
        }
      } else if (
        activeItem.id === HARDWARE_ID &&
        selectedTerminalItemId === START_TERMINAL_ITEM_ID
      ) {
        robotState = initialRobotState
      } else if (
        activeItem.id === HARDWARE_ID &&
        (selectedTerminalItemId === END_TERMINAL_ITEM_ID ||
          selectedTerminalItemId === PRESAVED_STEP_ID)
      ) {
        robotState = lastValidRobotState
      } else {
        const stepId =
          activeItem.id === HARDWARE_ID && selectedStepId != null
            ? selectedStepId
            : activeItem.id
        const timeline = robotStateTimeline.timeline
        const timelineIdx = orderedStepIds.includes(stepId)
          ? orderedStepIds.findIndex(id => id === stepId)
          : null

        if (timelineIdx == null || stepId === HARDWARE_ID) {
          if (stepId !== HARDWARE_ID) {
            console.error(`Expected non-null timelineIdx for step ${stepId}`)
          }
          return null
        }
        if (timelineIdx === 0) {
          robotState = initialRobotState
        } else {
          const prevFrame = timeline[timelineIdx - 1]
          if (prevFrame) robotState = prevFrame.robotState
        }
      }

      return robotState
    }
  )

//  TODO(jr, 9/20/23): we should test this util since it does a lot.
export const getUnoccupiedLabwareLocationOptions: Selector<Option[] | null> =
  createSelector(
    getRobotStateAtActiveItem,
    getModuleEntities,
    getRobotType,
    getLabwareEntities,
    getAdditionalEquipmentEntities,
    (
      robotState,
      moduleEntities,
      robotType,
      labwareEntities,
      additionalEquipmentEntities
    ) => {
      const deckDef = getDeckDefFromRobotType(robotType)
      const cutoutFixtures = deckDef.cutoutFixtures
      const hasWasteChute = Object.values(additionalEquipmentEntities).some(
        ae => ae.name === 'wasteChute'
      )
      const hasTrashBin = Object.values(additionalEquipmentEntities).some(
        ae => ae.name === 'trashBin'
      )
      const allSlotIds = deckDef.locations.addressableAreas.reduce<
        AddressableAreaName[]
      >((acc, slot) => {
        return hasWasteChute && slot.id === 'D3' ? acc : [...acc, slot.id]
      }, [])
      const stagingAreaCutoutIds = Object.values(additionalEquipmentEntities)
        .filter(aE => aE.name === 'stagingArea')
        //  TODO(jr, 11/13/23): fix AdditionalEquipment['location'] from type string to CutoutId
        .map(aE => aE.location as CutoutId)

      if (robotState == null) {
        return null
      }

      const trashCutouts = Object.values(additionalEquipmentEntities).reduce<
        string[]
      >(
        (acc, { name, location }) =>
          name === 'trashBin' && location != null ? [...acc, location] : acc,
        []
      )
      const { modules, labware } = robotState
      const slotIdsOccupiedByModules = Object.entries(modules).reduce<string[]>(
        (acc, [modId, modOnDeck]) => {
          if (moduleEntities[modId]?.type === THERMOCYCLER_MODULE_TYPE) {
            return robotType === 'OT-2 Standard'
              ? [...acc, '7', '8', '10', '11']
              : [...acc, 'A1', 'B1']
          } else {
            return [...acc, modOnDeck.slot]
          }
        },
        []
      )

      const unoccupiedAdapterOptions = Object.entries(labware).reduce<Option[]>(
        (acc, [labwareId, labwareOnDeck]) => {
          const hasLabwareAboveAdapter = Object.values(labware).some(
            ({ stack }) =>
              stack.includes(labwareId) &&
              getTopLocationInStack(stack) !== labwareId
          )
          const adapterSlot = getSlotInLocationStack(labwareOnDeck.stack)
          const modIdWithAdapter = Object.keys(modules).find(modId =>
            labwareOnDeck.stack.includes(modId)
          )
          const adapterDisplayName =
            labwareEntities[labwareId].def.metadata.displayName
          const modSlot =
            modIdWithAdapter != null ? modules[modIdWithAdapter].slot : null
          const isAdapter = getIsAdapter(labwareId, labwareEntities)
          const moduleUnderAdapter =
            modIdWithAdapter != null
              ? getModuleDisplayName(moduleEntities[modIdWithAdapter].model)
              : 'unknown module'
          const moduleSlotInfo = modSlot ?? 'unknown slot'
          const adapterSlotInfo = adapterSlot ?? 'unknown adapter'

          return isAdapter && !hasLabwareAboveAdapter
            ? [
                ...acc,
                {
                  name:
                    modIdWithAdapter != null
                      ? `${moduleUnderAdapter} with ${adapterDisplayName}`
                      : adapterDisplayName,
                  value: labwareId,
                  deckLabel:
                    modIdWithAdapter != null ? moduleSlotInfo : adapterSlotInfo,
                },
              ]
            : acc
        },
        []
      )

      const unoccupiedModuleOptions = Object.entries(modules).reduce<Option[]>(
        (acc, [modId, modOnDeck]) => {
          const isModuleIsAStacker =
            modOnDeck.moduleState.type === FLEX_STACKER_MODULE_TYPE
          const moduleHasLabware = !isModuleIsAStacker
            ? Object.entries(labware).some(
                ([_, lwOnDeck]) =>
                  lwOnDeck.stack[lwOnDeck.stack.length - 2] === modId
              )
            : (modOnDeck.moduleState as FlexStackerModuleState) == null
          const type = moduleEntities[modId].type
          const slot = modOnDeck.slot
          let tcLocations
          if (type === THERMOCYCLER_MODULE_TYPE) {
            tcLocations =
              slot === '7' ? TC_MODULE_LOCATION_OT2 : TC_MODULE_LOCATION_OT3
          }
          return moduleHasLabware
            ? acc
            : [
                ...acc,
                {
                  name: isModuleIsAStacker
                    ? slot
                    : getModuleDisplayName(moduleEntities[modId].model),
                  value: modId,
                  deckLabel: tcLocations != null ? tcLocations : slot,
                },
              ]
        },
        []
      )

      const stagingAreaAddressableAreaNames = stagingAreaCutoutIds
        .flatMap(cutoutId => {
          const addressableAreasOnCutout = cutoutFixtures.find(
            cutoutFixture =>
              cutoutFixture.id === STAGING_AREA_RIGHT_SLOT_FIXTURE
          )?.providesAddressableAreas[cutoutId]
          return addressableAreasOnCutout ?? []
        })
        .filter(aa => !isAddressableAreaStandardSlot(aa, deckDef))

      //  TODO(jr, 11/13/23): update COLUMN_4_SLOTS usage to FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS
      const notSelectedStagingAreaAddressableAreas = COLUMN_4_SLOTS.filter(
        slot =>
          stagingAreaAddressableAreaNames.every(
            addressableArea => addressableArea !== slot
          )
      )

      const isVacuumModuleOnDeck = Object.values(modules).some(
        ({ moduleState }) => moduleState.type === VACUUM_MODULE_TYPE
      )
      const isDockOpen = !Object.values(labware).some(({ stack }) =>
        stack.includes(VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA)
      )
      const vacuumDockOption =
        isVacuumModuleOnDeck && isDockOpen
          ? {
              name: 'Vacuum Module Dock A4',
              value: VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA,
              deckLabel: VACUUM_DOCK_DISPLAY_LOCATION,
            }
          : null

      const unoccupiedSlotOptions = allSlotIds.reduce<Option[]>(
        (acc, slotId) => {
          const isTrashSlot =
            robotType === FLEX_ROBOT_TYPE
              ? MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(slotId)
              : ['fixedTrash', '12'].includes(slotId)
          const allDeckDefTrashSlots = trashCutouts.map(
            cutout => cutout.split('cutout')[1]
          )
          return !slotIdsOccupiedByModules.includes(slotId) &&
            !Object.values(labware).some(lw => lw.stack.includes(slotId)) &&
            !isTrashSlot &&
            !allDeckDefTrashSlots.includes(slotId) &&
            !WASTE_CHUTE_ADDRESSABLE_AREAS.includes(slotId) &&
            !notSelectedStagingAreaAddressableAreas.includes(slotId) &&
            !FLEX_MODULE_ADDRESSABLE_AREAS.includes(slotId) &&
            !FLEX_STACKER_ADDRESSABLE_AREAS.includes(slotId)
            ? [...acc, { name: slotId, value: slotId, deckLabel: slotId }]
            : acc
        },
        []
      )

      const offDeck = {
        name: 'Off-deck',
        value: OFFDECK,
        deckLabel: 'Off-deck',
      }
      const wasteChuteSlot = {
        name: 'Waste Chute in D3',
        value: WASTE_CHUTE_CUTOUT,
        deckLabel: 'D3',
      }

      const trashSlots = trashCutouts.map(cutout => ({
        name: 'Trash bin',
        value: cutout,
        deckLabel: cutout.split('cutout')[1],
      }))

      return [
        ...(hasWasteChute ? [wasteChuteSlot] : []),
        ...(hasTrashBin ? trashSlots : []),
        ...unoccupiedAdapterOptions,
        ...unoccupiedModuleOptions,
        ...unoccupiedSlotOptions,
        ...(vacuumDockOption != null ? [vacuumDockOption] : []),
        offDeck,
      ]
    }
  )

export const getDeckSetupForActiveItem: Selector<AllTemporalPropertiesForTimelineFrame> =
  createSelector(
    getRobotStateAtActiveItem,
    getInitialDeckSetup,
    getLabwareEntities,

    (robotState, initialDeckSetup, labwareEntities) => {
      if (robotState == null) {
        return {
          pipettes: {},
          labware: {},
          modules: {},
          additionalEquipmentOnDeck: {},
        }
      }
      const { pipettes, modules, additionalEquipmentOnDeck } = initialDeckSetup
      return {
        pipettes: mapValues(pipettes, (pipEntity, pipId) => ({
          ...pipEntity,
          ...robotState.pipettes[pipId],
        })),
        labware: mapValues(labwareEntities, (lwEntity, lwId) => ({
          ...lwEntity,
          ...robotState.labware[lwId],
        })),
        modules: mapValues(modules, (modEntity, modId) => ({
          ...modEntity,
          ...robotState.modules[modId],
        })),
        additionalEquipmentOnDeck: mapValues(
          additionalEquipmentOnDeck,
          additionalEquipmentEntity => ({
            ...additionalEquipmentEntity,
          })
        ),
      }
    }
  )

/**
 * Largest stacks at the active timeline item.
 * Expects `robotState` from simulation to already carry `stackedOnNode` / `contains` (initial deck
 * from {@link getInitialRobotState}, then per-command updaters such as `forMoveLabware`).
 */
export const getAllLargestStacksAtActiveItem: Selector<
  LoadedLabwareLocation[][]
> = createSelector(getRobotStateAtActiveItem, robotState => {
  if (robotState == null) {
    return []
  }
  return getAllLargestStacks(robotState)
})

/** Provided addressable areas not covered by a labware stack at the timeline’s active item. */
export const getProvidedAddressableAreasExposedAtActiveItem: Selector<
  Set<AddressableAreaName>
> = createSelector(
  getRobotStateAtActiveItem,
  getRobotType,
  stepFormSelectors.getDeckConfiguration,
  getModuleEntities,
  (robotState, robotType, deckConfigurationState, moduleEntities) => {
    if (robotState == null) {
      return new Set<AddressableAreaName>()
    }
    return getProvidedAddressableAreasExposed({
      robotState,
      deckConfiguration: deckConfigurationState.deckConfig,
      deckDefinition: getDeckDefFromRobotType(robotType),
      moduleEntities,
    })
  }
)
