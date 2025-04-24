import { Fragment, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import values from 'lodash/values'
import { Module } from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getLabwareHasQuirk,
  getModuleDef2,
  getPositionFromSlotId,
  inferModuleOrientationFromSlot,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

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
import { getStagingAreaAddressableAreas } from '../../../utils'
import { HighlightLabware } from '../HighlightLabware'
import { getSlotInformation } from '../utils'
import { HighlightItems } from './HighlightItems'
import { HoveredItem } from './HoveredItem'
import { AdapterControls, LabwareControls, SlotControls } from './Overlays'
import { SelectedHoveredItems } from './SelectedHoveredItems'
import { SlotOverflowMenu } from './SlotOverflowMenu'
import { SlotWarning } from './SlotWarning'
import {
  getAdjacentLabware,
  getSwapBlockedAdapter,
  getSwapBlockedModule,
} from './utils'

import type { ComponentProps, Dispatch, SetStateAction } from 'react'
import type { ThermocyclerVizProps } from '@opentrons/components'
import type {
  AddressableAreaName,
  CutoutId,
  DeckDefinition,
  DeckSlotId,
} from '@opentrons/shared-data'
import type {
  ModuleTemporalProperties,
  ThermocyclerModuleState,
} from '@opentrons/step-generation'
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
  hoveredLabware: string | null
  setHover: Dispatch<SetStateAction<string | null>>
  showGen1MultichannelCollisionWarnings: boolean
  stagingAreaCutoutIds: CutoutId[]
  selectedZoomInSlot?: DeckSlotId
}

export function DeckSetupDetails(props: DeckSetupDetailsProps): JSX.Element {
  const {
    activeDeckSetup,
    addEquipment,
    deckDef,
    hover,
    hoveredLabware: hoveredLabwareFromProp,
    selectedZoomInSlot,
    terminalItemId,
    setHover,
    showGen1MultichannelCollisionWarnings,
    stagingAreaCutoutIds,
  } = props
  const robotType = useSelector(getRobotType)
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    activeDeckSetup,
    robotType
  )
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedSlot } = selectedSlotInfo
  const [menuListId, setShowMenuListForId] = useState<DeckSlotId | null>(null)
  const dispatch = useDispatch<any>()

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
  const [draggedLabware, setDraggedLabware] = useState<
    LabwareOnDeckType | null | undefined
  >(null)
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const swapBlockedModule = getSwapBlockedModule({
    modulesById: activeDeckSetup.modules,
    customLabwareDefs,
    hoveredLabware,
    draggedLabware,
  })
  const swapBlockedAdapter = getSwapBlockedAdapter({
    labwareById: activeDeckSetup.labware,
    hoveredLabware,
    draggedLabware,
  })

  const handleHoverEmptySlot = useCallback(() => {
    setHoveredLabware(null)
  }, [])

  const {
    createdLabwareForSlot,
    createdNestedLabwareForSlot,
    createdModuleForSlot,
    preSelectedFixture,
    slotPosition,
  } = getSlotInformation({
    deckSetup: activeDeckSetup,
    slot: selectedZoomInSlot ?? '',
    deckDef,
  })
  //  initiate the slot's info
  useEffect(() => {
    dispatch(
      editSlotInfo({
        createdNestedLabwareForSlot,
        createdLabwareForSlot,
        createdModuleForSlot,
        preSelectedFixture,
      })
    )
  }, [
    createdLabwareForSlot,
    createdNestedLabwareForSlot,
    createdModuleForSlot,
    preSelectedFixture,
  ])

  const allLabware: LabwareOnDeckType[] = Object.keys(
    activeDeckSetup.labware
  ).reduce<LabwareOnDeckType[]>((acc, labwareId) => {
    const labware = activeDeckSetup.labware[labwareId]
    return getLabwareHasQuirk(labware.def, 'fixedTrash')
      ? acc
      : [...acc, labware]
  }, [])

  const allModules: ModuleOnDeck[] = values(activeDeckSetup.modules)
  const menuListSlotPosition = getPositionFromSlotId(menuListId ?? '', deckDef)

  const multichannelWarningSlotIds: AddressableAreaName[] = showGen1MultichannelCollisionWarnings
    ? getSlotsWithCollisions(deckDef, allModules)
    : []

  const adjacentLabware =
    preSelectedFixture != null && selectedSlot.cutout != null
      ? getAdjacentLabware(
          preSelectedFixture,
          selectedSlot.cutout,
          activeDeckSetup.labware
        )
      : null

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
        const moduleDef = getModuleDef2(moduleOnDeck.model)

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
            return {
              lidMotorState,
              blockTargetTemp: moduleState.blockTargetTemp,
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

        const labwareLoadedOnModule = allLabware.find(
          lw => lw.slot === moduleOnDeck.id
        )
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

        const isAdapter = labwareLoadedOnModule?.def.allowedRoles?.includes(
          'adapter'
        )

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
            >
              {labwareLoadedOnModule != null &&
              !isLabwareOccludedByThermocyclerLid ? (
                <>
                  <LabwareOnDeck
                    x={0}
                    y={0}
                    labwareOnDeck={labwareLoadedOnModule}
                  />
                  <HighlightLabware
                    labwareOnDeck={labwareLoadedOnModule}
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
                      labwareId={labwareLoadedOnModule.id}
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
                      setDraggedLabware={setDraggedLabware}
                      swapBlocked={
                        (swapBlockedModule || swapBlockedAdapter) &&
                        (labwareLoadedOnModule.id === hoveredLabware?.id ||
                          labwareLoadedOnModule.id === draggedLabware?.id)
                      }
                      labwareOnDeck={labwareLoadedOnModule}
                      isSelected={selectedZoomInSlot != null}
                    />
                  )}
                </>
              ) : null}

              {labwareLoadedOnModule == null ? (
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
                />
              ) : null}
            </Module>
          </Fragment>
        ) : null
      })}

      {/* on-deck warnings for OT-2 and GEN1 8-channels only */}
      {multichannelWarningSlotIds.map(slotId => {
        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(slotId, deckDef)
          ?.boundingBox
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
          const stagingAreaAddressableAreas = getStagingAreaAddressableAreas(
            stagingAreaCutoutIds
          )
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
          const stagingAreaAddressableAreas = getStagingAreaAddressableAreas(
            stagingAreaCutoutIds
          )
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
            />
          )
        })}

      {/* all labware on deck NOT those in modules */}
      {allLabware.map(labware => {
        if (
          labware.slot === 'offDeck' ||
          allModules.some(m => m.id === labware.slot) ||
          allLabware.some(lab => lab.id === labware.slot) ||
          labware.id === adjacentLabware?.id
        )
          return null

        const slotPosition = getPositionFromSlotId(labware.slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          labware.slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        const labwareIsAdapter =
          labware.def.metadata.displayCategory === 'adapter'

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
            {labwareIsAdapter ? (
              <AdapterControls
                terminalItemId={terminalItemId}
                swapBlocked={swapBlockedAdapter}
                itemId={labware.slot}
                hover={hover}
                onDeck={true}
                labwareId={labware.id}
                setHover={setHover}
                setShowMenuListForId={setShowMenuListForId}
                key={labware.slot}
                slotPosition={slotPosition}
                slotBoundingBox={slotBoundingBox}
                handleDragHover={handleHoverEmptySlot}
                isSelected={selectedZoomInSlot != null}
              />
            ) : (
              <LabwareControls
                itemId={labware.slot}
                terminalItemId={terminalItemId}
                hover={hover}
                slotPosition={slotPosition}
                setHoveredLabware={setHoveredLabware}
                setDraggedLabware={setDraggedLabware}
                setHover={setHover}
                setShowMenuListForId={setShowMenuListForId}
                swapBlocked={
                  (swapBlockedModule || swapBlockedAdapter) &&
                  (labware.id === hoveredLabware?.id ||
                    labware.id === draggedLabware?.id)
                }
                labwareOnDeck={labware}
                isSelected={selectedZoomInSlot != null}
              />
            )}
          </Fragment>
        )
      })}

      {/* all nested labwares on deck  */}
      {allLabware.map(labware => {
        if (
          allModules.some(m => m.id === labware.slot) ||
          labware.slot === 'offDeck'
        )
          return null
        if (
          deckDef.locations.addressableAreas.some(
            addressableArea => addressableArea.id === labware.slot
          )
        ) {
          return null
        }
        const slotForOnTheDeck = allLabware.find(lab => lab.id === labware.slot)
          ?.slot
        const slotForOnMod = allModules.find(mod => mod.id === slotForOnTheDeck)
          ?.slot
        let slotPosition = null
        if (slotForOnMod != null) {
          slotPosition = getPositionFromSlotId(slotForOnMod, deckDef)
        } else if (slotForOnTheDeck != null) {
          slotPosition = getPositionFromSlotId(slotForOnTheDeck, deckDef)
        }
        if (slotPosition == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
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
              setDraggedLabware={setDraggedLabware}
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
            />
          </Fragment>
        )
      })}

      {/* highlight items from Protocol steps */}
      <HighlightItems robotType={robotType} deckDef={deckDef} />

      {/* selected hardware + labware */}
      <SelectedHoveredItems
        deckDef={deckDef}
        robotType={robotType}
        hoveredLabware={hoveredLabwareFromProp}
        slotPosition={slotPosition}
      />

      {/* hovered  labware */}
      <HoveredItem
        hoveredSlotPosition={slotPosition}
        hoveredLabware={hoveredLabwareFromProp}
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
