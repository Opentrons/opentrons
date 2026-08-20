import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useDragLayer } from 'react-dnd'
import { useDispatch, useSelector } from 'react-redux'
import values from 'lodash/values'

import { DeckLabelSet, Module } from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  getAddressableAreaFromSlotId,
  getModuleDef,
  getPositionFromAddressableAreaId,
  getPositionFromSlotId,
  inferModuleOrientationFromSlot,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  FAKE_HOPPER_LOCATION_MAP,
  getIsSlotAHopper,
  getIsSlotAVacuumDock,
  getSlotInLocationStack,
  VACUUM_DOCK_LOCATION,
} from '@opentrons/step-generation'

import {
  HOPPER_LABWARE_X_OFFSET,
  VACUUM_MODULE_SLOT,
} from '/protocol-designer/constants'
import { getTimelineIsBeingComputed } from '/protocol-designer/file-data/selectors'
import {
  getDeckConfiguration,
  getPendingCreationState,
} from '/protocol-designer/step-forms/selectors'

import { LabwareOnDeck } from '../../../components/organisms'
import { getSlotsWithCollisions } from '../../../components/organisms/utils'
import { getRobotType } from '../../../file-data/selectors'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { editSlotInfo } from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import {
  getSlotIdsBlockedBySpanningForThermocycler,
  getSlotIsEmpty,
} from '../../../step-forms'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import {
  getLabwaresOnModuleFromStack,
  getStagingAreaAddressableAreas,
} from '../../../utils'
import { HighlightLabware } from '../HighlightLabware'
import { getSlotInformation } from '../utils'
import { HighlightItems } from './HighlightItems'
import { useUpdateDeckConfigurationFromStartingDeck } from './hooks/useUpdateDeckConfigurationFromStartingDeck'
import { HopperLabwareRenders } from './HopperLabwareRenders'
import { AdapterControls, LabwareControls, SlotControls } from './Overlays'
import { ActiveLabwareControls } from './Overlays/ActiveLabwareControls'
import { SelectedItems } from './SelectedItems'
import { SlotOverflowMenu } from './SlotOverflowMenu'
import { SlotWarning } from './SlotWarning'
import {
  getAdjacentLabware,
  getIsVacuumCollar,
  getSwapBlockedAdapter,
  getSwapBlockedModule,
} from './utils'
import { VacuumDockLabwareRenders } from './VacuumDockLabwareRenders'

import type { ComponentProps, Dispatch, ReactNode, SetStateAction } from 'react'
import type { ThermocyclerVizProps } from '@opentrons/components'
import type {
  AddressableAreaName,
  CoordinateTuple,
  CutoutId,
  DeckDefinition,
  DeckSlotId,
} from '@opentrons/shared-data'
import type {
  HopperLocationMapKey,
  ModuleTemporalProperties,
  ThermocyclerModuleState,
} from '@opentrons/step-generation'
import type { FormData } from '../../../form-types'
import type {
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '../../../step-forms'
import type { DeckSetupTerminalIdType } from '../types'

interface DeckSetupDetailsProps extends DeckSetupTerminalIdType {
  activeDeckSetup: InitialDeckSetup
  addEquipment: (slotId: string) => void
  deckDef: DeckDefinition
  hover: string | null
  setHover: Dispatch<SetStateAction<string | null>>
  showGen1MultichannelCollisionWarnings: boolean
  currentStep: FormData | null
  stagingAreaCutoutIds: CutoutId[]
  selectedZoomInSlot?: DeckSlotId
}

export function DeckSetupDetails(props: DeckSetupDetailsProps): ReactNode {
  const {
    activeDeckSetup,
    addEquipment,
    deckDef,
    hover,
    selectedZoomInSlot,
    terminalItemId,
    setHover,
    showGen1MultichannelCollisionWarnings,
    stagingAreaCutoutIds,
    currentStep,
  } = props
  const { labware: activeLabware } = activeDeckSetup
  const robotType = useSelector(getRobotType)
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    activeDeckSetup,
    robotType
  )
  const pendingCreationStateForHopper = useSelector(getPendingCreationState)
  const timelineIsBeingComputed = useSelector(getTimelineIsBeingComputed)
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedSlot } = selectedSlotInfo
  const [menuListId, setShowMenuListForId] = useState<DeckSlotId | null>(null)
  const dispatch = useDispatch<any>()

  useUpdateDeckConfigurationFromStartingDeck({
    activeDeckSetup,
    robotType,
  })

  const { deckConfig } = useSelector(getDeckConfiguration)

  // handling module<>labware compat when moving labware to empty module
  // is handled by SlotControls. But when swapping labware when at least
  // one is on a module, we need to be aware of not only what labware is
  // being dragged, but also what labware is **being hovered over**.
  // The intrinsic state of `react-dnd` is not designed to handle that.
  // So we need to use our own state here to determine whether swapping
  // will be blocked due to labware<>module compatibility. That is what
  // hoveredLabware and draggedLabare are for.
  const [hoveredLabware, setHoveredLabware] = useState<
    LabwareOnDeckType | null | undefined
  >(null)
  const draggedLabware = useDragLayer(
    monitor => monitor.getItem()?.labwareOnDeck ?? null
  )
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const swapBlockedModule = getSwapBlockedModule({
    modulesById: activeDeckSetup.modules,
    customLabwareDefs,
    hoveredLabware,
    draggedLabware,
  })
  const swapBlockedAdapter = getSwapBlockedAdapter({
    labwareById: activeLabware,
    hoveredLabware,
    draggedLabware,
  })

  const handleHoverEmptySlot = useCallback(() => {
    setHoveredLabware(null)
  }, [])
  const allLabwareHaveStack = Object.values(activeLabware).every(
    labware => 'stack' in labware
  )
  // This is not an ideal scenario, but this safeguard is necessary until we
  // can refactor the asynchronous nature of the stacker labware creation.
  // Some renders of DeckSetupDetails specify the newly-created labware,
  // but their `stack` properties are not populated.
  const allLabware =
    pendingCreationStateForHopper ||
    timelineIsBeingComputed ||
    !allLabwareHaveStack
      ? {}
      : activeLabware

  const {
    createdAdapterForSlot,
    createdStackForSlot,
    createdLidForSlot,
    createdModuleForSlot,
    preSelectedFixture,
    slotPosition,
    isSlotAHopper,
  } = useMemo(
    () => {
      return getSlotInformation({
        deckSetup: { ...activeDeckSetup, labware: allLabware },
        slot: selectedZoomInSlot ?? '',
        deckDef,
        pendingCreationStateForHopper,
      })
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeDeckSetup, selectedZoomInSlot]
  )

  const createdTopLabwareForSlot = activeLabware[createdStackForSlot[0]]
  const amount = createdStackForSlot?.length ?? 1
  //  initiate the slot's info
  useEffect(
    () => {
      if (
        createdTopLabwareForSlot ||
        createdAdapterForSlot ||
        createdLidForSlot
      ) {
        dispatch(
          editSlotInfo({
            labwareDefURI: createdTopLabwareForSlot?.labwareDefURI,
            adapterDefURI: createdAdapterForSlot?.labwareDefURI,
            moduleModel: createdModuleForSlot?.model,
            fixture: preSelectedFixture,
            lidDefURI: createdLidForSlot?.labwareDefURI,
            amount,
          })
        )
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      createdAdapterForSlot,
      createdLidForSlot,
      createdTopLabwareForSlot,
      amount,
      selectedZoomInSlot,
    ]
  )

  const allModules: ModuleOnDeck[] = values(activeDeckSetup.modules)
  const isMenuListIdForHopper =
    menuListId != null && getIsSlotAHopper(menuListId)
  const isMenuListIdForVacuumDock =
    menuListId != null && getIsSlotAVacuumDock(menuListId)

  let adjustedMenuListId: AddressableAreaName | string | null = menuListId
  if (isMenuListIdForHopper) {
    adjustedMenuListId =
      FAKE_HOPPER_LOCATION_MAP[menuListId as HopperLocationMapKey]
  }

  let menuListSlotPosition: CoordinateTuple | null = null
  if (adjustedMenuListId != null) {
    menuListSlotPosition = isMenuListIdForVacuumDock
      ? getPositionFromAddressableAreaId({
          addressableAreaId: adjustedMenuListId as AddressableAreaName,
          deckDef,
          deckConfiguration: deckConfig,
        })
      : getPositionFromSlotId(
          adjustedMenuListId,
          deckDef,
          ...(isMenuListIdForHopper ? [HOPPER_LABWARE_X_OFFSET] : [])
        )
  }

  const multichannelWarningSlotIds: AddressableAreaName[] =
    showGen1MultichannelCollisionWarnings
      ? getSlotsWithCollisions(deckDef, allModules)
      : []

  const adjacentLabware =
    preSelectedFixture != null && selectedSlot.cutout != null
      ? getAdjacentLabware(
          preSelectedFixture,
          selectedSlot.cutout,
          activeLabware
        )
      : null

  // make sure the top labware (lid) is rendered first in the stack if
  // it gets moved there later on
  const allLabwareValues = Object.values(allLabware)
  const sortedLabware = [...allLabwareValues].sort((a, b) => {
    // get how deep each labware is in its stack
    const aDepth = a.stack.length
    const bDepth = b.stack.length

    // render deeper stacks last (on top)
    return aDepth - bDepth
  })

  return (
    <>
      {/* all modules */}
      {allModules.map(moduleOnDeck => {
        const slotId = moduleOnDeck.slot

        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slotId} for module ${moduleOnDeck.id}`)
          return null
        }
        const moduleDef = getModuleDef(moduleOnDeck.model)

        const getModuleInnerProps = (
          moduleState: ModuleTemporalProperties['moduleState']
        ): ComponentProps<typeof Module>['innerProps'] => {
          if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
            let lidMotorState = 'unknown'
            if (
              terminalItemId === START_TERMINAL_ITEM_ID ||
              moduleState.lidOpen
            ) {
              lidMotorState = 'open'
            } else if (moduleState.lidOpen === false) {
              lidMotorState = 'closed'
            }

            let blockTargetTemp
            switch (moduleState.currentBlockActivity.type) {
              case 'blockTargetTemp':
                blockTargetTemp =
                  moduleState.currentBlockActivity.blockTargetTemp
                break
              case 'blockDeactivated':
                blockTargetTemp = null
                break
              case 'profile':
                blockTargetTemp = null
                break
              default:
                moduleState.currentBlockActivity satisfies never
            }

            return {
              lidMotorState,
              blockTargetTemp,
            }
          } else if (
            'targetTemperature' in moduleState &&
            moduleState.type === 'temperatureModuleType'
          ) {
            return {
              targetTemperature: moduleState.targetTemperature,
            }
          } else if ('targetTemp' in moduleState) {
            return {
              targetTemp: moduleState.targetTemp,
            }
          }
        }

        const { topMostId, rightBelowTopId, hopperTopMostId } =
          getLabwaresOnModuleFromStack(moduleOnDeck.id, allLabwareValues)
        const labwareInterfaceBoundingBox = {
          xDimension: moduleDef.dimensions.labwareInterfaceXDimension ?? 0,
          yDimension: moduleDef.dimensions.labwareInterfaceYDimension ?? 0,
          zDimension: 0,
        }
        const isLabwareOccludedByThermocyclerLid =
          moduleOnDeck.type === THERMOCYCLER_MODULE_TYPE &&
          (moduleOnDeck.moduleState as ThermocyclerModuleState).lidOpen !==
            true &&
          terminalItemId !== START_TERMINAL_ITEM_ID

        const tempInnerProps = getModuleInnerProps(moduleOnDeck.moduleState)
        const innerProps =
          moduleOnDeck.type === THERMOCYCLER_MODULE_TYPE
            ? {
                ...tempInnerProps,
                lidMotorState:
                  (tempInnerProps as ThermocyclerVizProps).lidMotorState !==
                  'open'
                    ? 'closed'
                    : 'open',
              }
            : tempInnerProps
        const labwareOnModule =
          topMostId != null ? activeLabware[topMostId] : null
        const labwareRightBelowTopMostLabware =
          rightBelowTopId != null ? activeLabware[rightBelowTopId] : null
        const isAdapter = labwareOnModule?.def.allowedRoles?.includes('adapter')
        const isLabwareOnModuleVacuumCollar =
          labwareOnModule?.def.parameters.quirks?.includes(
            'vacuumModuleDock'
          ) ?? false
        const isLabwareBelowTopVacuumCollar =
          labwareRightBelowTopMostLabware?.def.parameters.quirks?.includes(
            'vacuumModuleDock'
          ) ?? false
        const vacuumMainModuleStack =
          moduleOnDeck.type === VACUUM_MODULE_TYPE
            ? allLabwareValues
                .filter(
                  lw =>
                    lw.stack.includes(moduleOnDeck.id) &&
                    !lw.stack.includes(VACUUM_DOCK_LOCATION)
                )
                .sort((a, b) => a.stack.length - b.stack.length)
            : null
        const labwareInHopper =
          'labwareInHopper' in moduleOnDeck.moduleState
            ? moduleOnDeck.moduleState.labwareInHopper
            : null
        const topLabwareGroup =
          labwareInHopper?.[labwareInHopper.length - 1] ?? null

        return moduleOnDeck.slot !== selectedSlot.slot ? (
          <Fragment key={moduleOnDeck.id}>
            <Module
              key={moduleOnDeck.id}
              x={slotPosition[0]}
              y={slotPosition[1]}
              def={moduleDef}
              orientation={inferModuleOrientationFromXCoordinate(
                slotPosition[0]
              )}
              innerProps={innerProps}
              targetSlotId={slotId}
              targetDeckId={deckDef.otId}
              childrenPositioningMode={
                moduleOnDeck.type === FLEX_STACKER_MODULE_TYPE
                  ? 'passThrough'
                  : 'offsetToSlot'
              }
            >
              {topLabwareGroup ? (
                <HopperLabwareRenders
                  labwaresOnDeck={activeLabware}
                  slot={moduleOnDeck.slot}
                  topLabwareGroup={topLabwareGroup}
                  allModules={allModules}
                  terminalItemId={terminalItemId}
                  setHover={setHover}
                  setShowMenuListForId={setShowMenuListForId}
                  hover={hover}
                  setHoveredLabware={setHoveredLabware}
                  selectedZoomInSlot={selectedZoomInSlot}
                />
              ) : null}
              {labwareOnModule != null &&
              !isLabwareOccludedByThermocyclerLid ? (
                <>
                  {vacuumMainModuleStack != null ? (
                    vacuumMainModuleStack.map(lw => (
                      <LabwareOnDeck
                        key={lw.id}
                        x={0}
                        y={0}
                        labwareOnDeck={lw}
                        centerInSlot
                      />
                    ))
                  ) : (
                    <>
                      {labwareRightBelowTopMostLabware != null ? (
                        <LabwareOnDeck
                          x={0}
                          y={0}
                          labwareOnDeck={labwareRightBelowTopMostLabware}
                          centerInSlot={isLabwareBelowTopVacuumCollar}
                        />
                      ) : null}
                      <LabwareOnDeck
                        x={0}
                        y={0}
                        labwareOnDeck={labwareOnModule}
                        centerInSlot={isLabwareOnModuleVacuumCollar}
                      />
                    </>
                  )}
                  <HighlightLabware
                    labwareOnDeck={labwareOnModule}
                    position={[0, 0, 0]}
                    isZoomed={selectedZoomInSlot != null}
                  />

                  {isAdapter ? (
                    <AdapterControls
                      itemId={slotId}
                      swapBlocked={swapBlockedAdapter}
                      hover={hover}
                      onDeck={false}
                      setHover={setHover}
                      setShowMenuListForId={setShowMenuListForId}
                      labwareId={labwareOnModule.id}
                      key={moduleOnDeck.slot}
                      slotPosition={[0, 0, 0]} // Module Component already handles nested positioning
                      slotBoundingBox={labwareInterfaceBoundingBox}
                      handleDragHover={handleHoverEmptySlot}
                      terminalItemId={terminalItemId}
                      isSelected={selectedZoomInSlot != null}
                    />
                  ) : (
                    <LabwareControls
                      terminalItemId={terminalItemId}
                      itemId={slotId}
                      setHover={setHover}
                      setShowMenuListForId={setShowMenuListForId}
                      hover={hover}
                      slotPosition={[0, 0, 0]} // Module Component already handles nested positioning
                      setHoveredLabware={setHoveredLabware}
                      swapBlocked={
                        (swapBlockedModule || swapBlockedAdapter) &&
                        (labwareOnModule.id === hoveredLabware?.id ||
                          labwareOnModule.id === draggedLabware?.id)
                      }
                      labwareOnDeck={labwareOnModule}
                      isSelected={selectedZoomInSlot != null}
                      allModules={allModules}
                    />
                  )}
                  <ActiveLabwareControls
                    slotPosition={[0, 0, 0]}
                    slotBoundingBox={labwareInterfaceBoundingBox}
                    itemId={slotId}
                    terminalItemId={terminalItemId}
                    hover={hover}
                    setHover={setHover}
                  />
                </>
              ) : null}

              {labwareOnModule == null ? (
                <SlotControls
                  terminalItemId={terminalItemId}
                  itemId={slotId}
                  key={moduleOnDeck.slot}
                  slotPosition={[0, 0, 0]} // Module Component already handles nested positioning
                  slotBoundingBox={labwareInterfaceBoundingBox}
                  moduleType={moduleOnDeck.type}
                  handleDragHover={handleHoverEmptySlot}
                  slotId={moduleOnDeck.id}
                  hover={hover}
                  setHover={setHover}
                  setShowMenuListForId={setShowMenuListForId}
                  isSelected={selectedZoomInSlot != null}
                  deckDef={deckDef}
                  stagingAreaAddressableAreas={[]}
                  addEquipment={addEquipment}
                />
              ) : null}
              {hopperTopMostId == null &&
              moduleOnDeck.type === FLEX_STACKER_MODULE_TYPE ? (
                <SlotControls
                  terminalItemId={terminalItemId}
                  itemId={`hopper${slotId}`}
                  key={`${moduleOnDeck.slot}_flexHopper`}
                  slotPosition={[HOPPER_LABWARE_X_OFFSET, 0, 0]}
                  slotBoundingBox={labwareInterfaceBoundingBox}
                  moduleType={moduleOnDeck.type}
                  handleDragHover={handleHoverEmptySlot}
                  slotId={moduleOnDeck.id}
                  hover={hover}
                  setHover={setHover}
                  setShowMenuListForId={setShowMenuListForId}
                  isSelected={selectedZoomInSlot != null}
                  deckDef={deckDef}
                  stagingAreaAddressableAreas={[]}
                  addEquipment={addEquipment}
                />
              ) : null}
            </Module>
          </Fragment>
        ) : null
      })}

      {/* Vacuum dock labware renders positioned independently in addressable area */}
      {allModules
        .filter(
          module =>
            module.type === VACUUM_MODULE_TYPE &&
            module.slot === VACUUM_MODULE_SLOT
        )
        .map(vacuumModule => {
          const { vacuumDockTopMostId } = getLabwaresOnModuleFromStack(
            vacuumModule.id,
            allLabwareValues
          )
          const dockLabwareStack =
            vacuumDockTopMostId != null
              ? allLabwareValues
                  .filter(lw => lw.stack.includes(VACUUM_DOCK_LOCATION))
                  .sort((a, b) => b.stack.length - a.stack.length)
                  .map(lw => lw.id)
              : []

          // Check if dock has a collar (same logic as main module area)
          const dockHasCollar = dockLabwareStack.some(labwareId => {
            return (
              activeLabware[labwareId] != null &&
              getIsVacuumCollar(activeLabware[labwareId].def)
            )
          })

          // this should pull the addressable area position for the vacuum dock
          const dockSlotPosition = getPositionFromAddressableAreaId({
            addressableAreaId: 'vacuumModuleV1DockA4',
            deckDef,
            deckConfiguration: deckConfig,
          })
          const topLabware =
            vacuumDockTopMostId != null
              ? activeLabware[vacuumDockTopMostId]
              : null
          const dockBoundingBox = topLabware
            ? {
                xDimension: topLabware.def.dimensions.xDimension,
                yDimension: topLabware.def.dimensions.yDimension,
                zDimension: 0,
              }
            : (getAddressableAreaFromSlotId('A4', deckDef)?.boundingBox ??
                // should never hit, but default to standard slot addressable area footprint
                {
                  xDimension: 128,
                  yDimension: 86,
                  zDimension: 0,
                })

          return dockSlotPosition != null ? (
            <Fragment key={`${vacuumModule.id}_dock`}>
              {dockHasCollar ? (
                <VacuumDockLabwareRenders
                  labwaresOnDeck={activeLabware}
                  dockLabwareStack={dockLabwareStack}
                  allModules={allModules}
                  terminalItemId={terminalItemId}
                  setHover={setHover}
                  setShowMenuListForId={setShowMenuListForId}
                  hover={hover}
                  setHoveredLabware={setHoveredLabware}
                  selectedZoomInSlot={selectedZoomInSlot}
                  x={dockSlotPosition[0]}
                  y={dockSlotPosition[1]}
                />
              ) : (
                <SlotControls
                  terminalItemId={terminalItemId}
                  itemId={VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA}
                  key={`${vacuumModule.slot}_vacuumDock`}
                  slotPosition={[dockSlotPosition[0], dockSlotPosition[1], 0]}
                  slotBoundingBox={dockBoundingBox}
                  moduleType={vacuumModule.type}
                  handleDragHover={handleHoverEmptySlot}
                  slotId={vacuumModule.id}
                  hover={hover}
                  setHover={setHover}
                  setShowMenuListForId={setShowMenuListForId}
                  isSelected={selectedZoomInSlot != null}
                  deckDef={deckDef}
                  stagingAreaAddressableAreas={[]}
                  addEquipment={addEquipment}
                />
              )}
            </Fragment>
          ) : null
        })}

      {/* on-deck warnings for OT-2 and GEN1 8-channels only */}
      {multichannelWarningSlotIds.map(slotId => {
        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          slotId,
          deckDef
        )?.boundingBox
        return slotPosition != null && slotBoundingBox != null ? (
          <SlotWarning
            key={slotId}
            warningType="gen1multichannel"
            x={slotPosition[0]}
            y={slotPosition[1]}
            xDimension={slotBoundingBox.xDimension}
            yDimension={slotBoundingBox.yDimension}
            orientation={inferModuleOrientationFromSlot(slotId)}
          />
        ) : null
      })}

      {/* SlotControls for all empty deck */}
      {deckDef.locations.addressableAreas
        .filter(addressableArea => {
          const stagingAreaAddressableAreas =
            getStagingAreaAddressableAreas(stagingAreaCutoutIds)

          const addressableAreas =
            isAddressableAreaStandardSlot(addressableArea.id, deckDef) ||
            stagingAreaAddressableAreas.includes(addressableArea.id)
          return (
            addressableAreas &&
            !slotIdsBlockedBySpanning.includes(addressableArea.id) &&
            getSlotIsEmpty(
              activeDeckSetup,
              addressableArea.id,
              draggedLabware == null
            )
          )
        })
        .map(addressableArea => {
          const stagingAreaAddressableAreas =
            getStagingAreaAddressableAreas(stagingAreaCutoutIds)
          const moduleOnSlot = Object.values(activeDeckSetup.modules).find(
            module => module.slot === addressableArea.id
          )

          return (
            <SlotControls
              terminalItemId={terminalItemId}
              key={addressableArea.id}
              itemId={addressableArea.id}
              slotPosition={getPositionFromSlotId(addressableArea.id, deckDef)}
              slotBoundingBox={addressableArea.boundingBox}
              slotId={addressableArea.id}
              // Module slots' ids reference their parent module
              moduleType={moduleOnSlot?.type ?? null}
              handleDragHover={handleHoverEmptySlot}
              hover={hover}
              setHover={setHover}
              setShowMenuListForId={setShowMenuListForId}
              isSelected={selectedZoomInSlot != null}
              deckDef={deckDef}
              stagingAreaAddressableAreas={stagingAreaAddressableAreas}
              addEquipment={addEquipment}
            />
          )
        })}

      {/* all labware on deck NOT those in modules */}
      {sortedLabware.map(labware => {
        if (
          getSlotInLocationStack(labware.stack) === 'offDeck' ||
          allModules.some(m => labware.stack.includes(m.id)) ||
          labware.id === adjacentLabware?.id ||
          labware.stack.includes('fixedTrash')
        ) {
          return null
        }
        const slot = getSlotInLocationStack(labware.stack)
        const labwareAmount = labware.stack.reduce(
          (amount, item) => amount + (activeLabware[item] ? 1 : 0),
          0
        )
        const isTopLabware = labware.stack[0] === labware.id
        const slotPosition = getPositionFromSlotId(slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(`no slot ${slot} for labware ${labware.id}!`)
          return null
        }
        const labwareIsAdapter =
          labware.def.metadata.displayCategory === 'adapter'

        //  TODO: delete this special-case when the tiprackLid svg bug is fixed!!!!
        const showDeckLabwareSetWithTiprackLid =
          labware.def.parameters.loadName === 'opentrons_flex_tiprack_lid'
            ? selectedZoomInSlot == null
            : true

        return (
          <Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            {labwareAmount > 1 &&
            isTopLabware &&
            showDeckLabwareSetWithTiprackLid ? (
              <DeckLabelSet
                deckLabels={[]}
                x={slotPosition[0]}
                y={slotPosition[1]}
                width={labware.def.dimensions.xDimension}
                height={labware.def.dimensions.yDimension}
                showModuleIcon
                showBorder={false}
              />
            ) : null}
            <HighlightLabware
              labwareOnDeck={labware}
              position={slotPosition}
              isZoomed={selectedZoomInSlot != null}
            />
            {labwareIsAdapter ? (
              <AdapterControls
                terminalItemId={terminalItemId}
                swapBlocked={swapBlockedAdapter}
                itemId={slot}
                hover={hover}
                onDeck={true}
                labwareId={labware.id}
                setHover={setHover}
                setShowMenuListForId={setShowMenuListForId}
                key={slot}
                slotPosition={slotPosition}
                slotBoundingBox={slotBoundingBox}
                handleDragHover={handleHoverEmptySlot}
                isSelected={selectedZoomInSlot != null}
              />
            ) : (
              <LabwareControls
                itemId={slot}
                terminalItemId={terminalItemId}
                hover={hover}
                slotPosition={slotPosition}
                setHoveredLabware={setHoveredLabware}
                setHover={setHover}
                setShowMenuListForId={setShowMenuListForId}
                swapBlocked={
                  (swapBlockedModule || swapBlockedAdapter) &&
                  (labware.id === hoveredLabware?.id ||
                    labware.id === draggedLabware?.id)
                }
                labwareOnDeck={labware}
                isSelected={selectedZoomInSlot != null}
                allModules={allModules}
              />
            )}
            <ActiveLabwareControls
              slotPosition={slotPosition}
              slotBoundingBox={slotBoundingBox}
              itemId={slot}
              terminalItemId={terminalItemId}
              hover={hover}
              setHover={setHover}
            />
          </Fragment>
        )
      })}

      {/* all nested labwares */}
      {allLabwareValues.map(labware => {
        if (
          allModules.some(m => labware.stack.includes(m.id)) ||
          getSlotInLocationStack(labware.stack) === 'offDeck'
        ) {
          return null
        }
        if (
          deckDef.locations.addressableAreas.some(addressableArea =>
            labware.stack.includes(addressableArea.id)
          )
        ) {
          return null
        }
        const slotForOnTheDeck = getSlotInLocationStack(labware.stack)
        const slotForOnMod = allModules.find(
          mod => mod.id === slotForOnTheDeck
        )?.slot
        let slotPosition = null
        if (slotForOnMod != null) {
          slotPosition = getPositionFromSlotId(slotForOnMod, deckDef)
        } else if (slotForOnTheDeck != null) {
          slotPosition = getPositionFromSlotId(slotForOnTheDeck, deckDef)
        }
        if (slotPosition == null) {
          console.warn(`no slot ${slotForOnTheDeck} for labware ${labware.id}!`)
          return null
        }

        const moduleParent = allModules.find(
          module => module.id === slotForOnTheDeck
        )
        const slotOnDeck =
          moduleParent == null
            ? slotForOnTheDeck
            : allModules.find(module => module.id === slotForOnTheDeck)?.slot

        return (
          <Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <HighlightLabware
              labwareOnDeck={labware}
              position={slotPosition}
              isZoomed={selectedZoomInSlot != null}
            />
            <LabwareControls
              hover={hover}
              itemId={slotOnDeck ?? ''}
              slotPosition={slotPosition}
              setHoveredLabware={setHoveredLabware}
              setHover={setHover}
              setShowMenuListForId={setShowMenuListForId}
              swapBlocked={
                (swapBlockedModule || swapBlockedAdapter) &&
                (labware.id === hoveredLabware?.id ||
                  labware.id === draggedLabware?.id)
              }
              labwareOnDeck={labware}
              isSelected={selectedZoomInSlot != null}
              terminalItemId={terminalItemId}
              allModules={allModules}
            />
            <ActiveLabwareControls
              slotPosition={[0, 0, 0]}
              slotBoundingBox={{
                xDimension: labware.def.dimensions.xDimension,
                yDimension: labware.def.dimensions.yDimension,
                zDimension: 0,
              }}
              itemId={slotOnDeck ?? ''}
              terminalItemId={terminalItemId}
              hover={hover}
              setHover={setHover}
            />
          </Fragment>
        )
      })}

      {/* highlight items from Protocol steps */}
      <HighlightItems
        robotType={robotType}
        deckDef={deckDef}
        currentStep={currentStep}
      />

      {/* selected hardware + labware */}
      <SelectedItems
        deckDef={deckDef}
        robotType={robotType}
        slotPosition={slotPosition}
        isSlotAHopper={isSlotAHopper}
      />

      {/* slot overflow menu */}
      {menuListSlotPosition != null && menuListId != null ? (
        <SlotOverflowMenu
          menuListSlotPosition={menuListSlotPosition}
          location={menuListId}
          addEquipment={addEquipment}
          setShowMenuList={() => {
            setShowMenuListForId(null)
          }}
        />
      ) : null}
    </>
  )
}
