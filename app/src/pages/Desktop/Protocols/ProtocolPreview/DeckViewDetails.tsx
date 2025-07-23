import { Fragment } from 'react'
import clsx from 'clsx'

import {
  COLORS,
  Module,
  RobotCoordsForeignDiv,
  SingleSlotFixture,
  StyledText,
} from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getModuleDef,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { DeckViewOverlay } from './DeckViewOverlay'
import { LabwareOnDeck } from './LabwareOnDeck'
import styles from './preview.module.css'
import {
  getActiveLayer,
  getSlotIdsBlockedBySpanningForThermocycler,
  getSlotIsEmpty,
  getStagingAreaAddressableAreas,
  getThermocyclerOverlayText,
  getTopmostLabwareOnModuleFromStack,
} from './utils'

import type { ComponentProps, Dispatch, SetStateAction } from 'react'
import type { ThermocyclerVizProps } from '@opentrons/components'
import type {
  CutoutId,
  DeckDefinition,
  Liquid,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  ModuleTemporalProperties,
  TimelineFrame,
} from '@opentrons/step-generation'
import type { LabwareEntityExtended } from './DeckView'

const STANDARD_X_WIDTH = 127.76
const STANDARD_Y_HEIGHT = 85.48

interface DeckViewDetailsProps {
  labwareEntitiesExtended: Record<string, LabwareEntityExtended>
  liquids: Liquid[]
  robotState: TimelineFrame
  robotType: RobotType
  selectedSlot: string | null
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  stagingAreaCutoutIds: CutoutId[]
  invariantContext: InvariantContext
  deckDef: DeckDefinition
  hoveredSlot: string | null
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
  showDeckRenders: boolean
  selectedRunTimeCommand?: RunTimeCommand
}
export function DeckViewDetails(props: DeckViewDetailsProps): JSX.Element {
  const {
    robotState,
    robotType,
    selectedSlot,
    deckDef,
    setSelectedSlot,
    stagingAreaCutoutIds,
    invariantContext,
    selectedRunTimeCommand,
    setHoveredSlot,
    hoveredSlot,
    showDeckRenders,
    liquids,
    labwareEntitiesExtended,
  } = props
  const { labware, modules, pipettes } = robotState
  const { labwareEntities, moduleEntities, trashBinEntities } = invariantContext
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    modules,
    moduleEntities,
    robotType
  )
  const trashSlots = Object.values(trashBinEntities).map(
    trash => trash.location.split('cutout')[1]
  )
  return (
    <>
      {/* all modules */}
      {Object.entries(modules).map(([id, { slot, moduleState }]) => {
        const slotPosition = getPositionFromSlotId(slot, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slot} for module ${id}`)
          return null
        }
        const labwareLoadedOnModuleId = getTopmostLabwareOnModuleFromStack(
          id,
          Object.values(labware)
        )
        const isStepAssosciatedWithModule =
          selectedRunTimeCommand != null &&
          'moduleId' in selectedRunTimeCommand.params &&
          selectedRunTimeCommand.params.moduleId === id

        const isTiprack =
          labwareEntities[labwareLoadedOnModuleId]?.def.parameters.isTiprack
        const { copy, isActiveLayerVisible } = getActiveLayer(
          isTiprack,
          Object.values(pipettes),
          labwareLoadedOnModuleId,
          selectedRunTimeCommand
        )
        const moduleDef = getModuleDef(moduleEntities[id].model)
        const moduleType = moduleEntities[id].type

        const getModuleInnerProps = (
          moduleState: ModuleTemporalProperties['moduleState']
        ): ComponentProps<typeof Module>['innerProps'] => {
          if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
            let lidMotorState = 'unknown'
            if (moduleState.lidOpen) {
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
        const tempInnerProps = getModuleInnerProps(moduleState)
        const isActive = selectedSlot === slot || hoveredSlot === slot

        const innerTCProps = {
          ...tempInnerProps,
          lidMotorState:
            (tempInnerProps as ThermocyclerVizProps).lidMotorState !== 'open'
              ? 'closed'
              : 'open',
        }

        let fillColor = COLORS.grey50
        if (showDeckRenders && !isActive) {
          fillColor = COLORS.transparent
        } else if (isActive) {
          fillColor = COLORS.grey60
        }

        const innerLabwareRender =
          labwareLoadedOnModuleId != null ? (
            <>
              <RobotCoordsForeignDiv>
                <div
                  className={clsx(
                    styles.slot_box,
                    getSlotColorClass(
                      hoveredSlot,
                      selectedSlot,
                      slot,
                      isActiveLayerVisible
                    )
                  )}
                >
                  <StyledText
                    desktopStyle="captionRegular"
                    transform={`rotate(180deg) scaleX(-1)`}
                    color={COLORS.white}
                  >
                    {isActiveLayerVisible
                      ? copy
                      : labwareEntitiesExtended[labwareLoadedOnModuleId]
                          .nickName ??
                        labwareEntitiesExtended[labwareLoadedOnModuleId].def
                          .metadata.displayName}
                  </StyledText>
                </div>
              </RobotCoordsForeignDiv>
            </>
          ) : null

        let fixtureBaseColor = COLORS.grey35
        if (showDeckRenders) {
          if (isStepAssosciatedWithModule || isActiveLayerVisible) {
            fixtureBaseColor = '#E6D5EC'
          } else if (
            !isStepAssosciatedWithModule &&
            !isActiveLayerVisible &&
            selectedSlot === slot
          ) {
            fixtureBaseColor = COLORS.grey40
          }
        }

        return (
          <Fragment key={id}>
            {showDeckRenders ? (
              <>
                {moduleType === THERMOCYCLER_MODULE_TYPE ? (
                  <SingleSlotFixture
                    key="A1"
                    cutoutId="cutoutA1"
                    deckDefinition={deckDef}
                    showExpansion={true}
                    fixtureBaseColor={fixtureBaseColor}
                    slotClipColor={COLORS.grey60}
                    stroke={
                      hoveredSlot === 'B1' || selectedSlot === 'B1'
                        ? COLORS.purple50
                        : undefined
                    }
                  />
                ) : null}
                <SingleSlotFixture
                  key={slot}
                  cutoutId={`cutout${slot}` as CutoutId}
                  deckDefinition={deckDef}
                  showExpansion={false}
                  fixtureBaseColor={fixtureBaseColor}
                  slotClipColor={COLORS.grey60}
                  stroke={
                    hoveredSlot === slot || selectedSlot === slot
                      ? COLORS.purple50
                      : undefined
                  }
                />
                <Module
                  key={id}
                  x={slotPosition[0]}
                  y={slotPosition[1]}
                  def={moduleDef}
                  orientation={inferModuleOrientationFromXCoordinate(
                    slotPosition[0]
                  )}
                  innerProps={
                    moduleType === THERMOCYCLER_MODULE_TYPE
                      ? innerTCProps
                      : tempInnerProps
                  }
                  targetSlotId={slot}
                  targetDeckId={deckDef.otId}
                  childrenPositioningMode="offsetToSlot"
                  setSelectedSlot={setSelectedSlot}
                  setHoveredSlot={setHoveredSlot}
                >
                  {labwareLoadedOnModuleId != null ? (
                    <LabwareOnDeck
                      robotState={robotState}
                      labwareDef={labwareEntities[labwareLoadedOnModuleId].def}
                      liquids={liquids}
                      labwareId={labwareLoadedOnModuleId}
                      x={0}
                      y={0}
                      setSelectedSlot={setSelectedSlot}
                      setHoveredSlot={setHoveredSlot}
                    />
                  ) : null}
                </Module>
              </>
            ) : (
              <>
                <DeckViewOverlay
                  key={slot}
                  slotId={slot}
                  slotPosition={slotPosition}
                  slotFillColor={fillColor}
                  robotType={robotType}
                  invariantContext={invariantContext}
                  robotState={robotState}
                  setSelectedSlot={setSelectedSlot}
                  setHoveredSlot={setHoveredSlot}
                >
                  <div className={styles.align_deck_modules}>
                    {moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE &&
                    (!showDeckRenders ||
                      hoveredSlot === slot ||
                      selectedSlot === slot) ? (
                      <div className={styles.module_copy}>
                        <StyledText
                          desktopStyle="bodyLargeRegular"
                          color={COLORS.white}
                        >
                          {getModuleDef(moduleEntities[id].model).displayName}
                        </StyledText>
                      </div>
                    ) : null}
                    {showDeckRenders && !isActive ? null : innerLabwareRender}
                  </div>
                </DeckViewOverlay>
                {isStepAssosciatedWithModule ? (
                  <DeckViewOverlay
                    key={slot}
                    slotId={slot}
                    slotPosition={slotPosition}
                    opacity={0.9}
                    slotFillColor={isActive ? COLORS.purple60 : COLORS.purple50}
                    robotType={robotType}
                    invariantContext={invariantContext}
                    robotState={robotState}
                    setSelectedSlot={setSelectedSlot}
                    setHoveredSlot={setHoveredSlot}
                  >
                    <StyledText
                      desktopStyle="bodyLargeRegular"
                      color={COLORS.white}
                    >
                      {/* TODO: for user-testing purposes, only some copy is filled out but
                  if we decide to keep this concept, we should consider adding each command copy to
                  the command result or something */}
                      {moduleType === THERMOCYCLER_MODULE_TYPE &&
                      selectedRunTimeCommand != null
                        ? getThermocyclerOverlayText(
                            selectedRunTimeCommand.commandType
                          )
                        : 'Loading or changing module state'}
                    </StyledText>
                  </DeckViewOverlay>
                ) : null}
              </>
            )}
          </Fragment>
        )
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
            getSlotIsEmpty(robotState, addressableArea.id) &&
            !trashSlots.includes(addressableArea.id)
          )
        })

        .map(addressableArea => {
          return (
            <Fragment key={addressableArea.id}>
              <SingleSlotFixture
                onMouseEnter={() => {
                  setHoveredSlot(addressableArea.id)
                }}
                onMouseLeave={() => {
                  setHoveredSlot(null)
                }}
                onClick={() => {
                  setSelectedSlot(addressableArea.id)
                }}
                cursor="pointer"
                cutoutId={`cutout${addressableArea.id}` as CutoutId}
                deckDefinition={deckDef}
                slotClipColor={
                  selectedSlot === addressableArea.id ||
                  hoveredSlot === addressableArea.id
                    ? COLORS.grey60
                    : COLORS.transparent
                }
                fixtureBaseColor={
                  selectedSlot === addressableArea.id ||
                  (hoveredSlot === addressableArea.id && !showDeckRenders)
                    ? '#E6D5EC'
                    : COLORS.transparent
                }
                stroke={
                  hoveredSlot === addressableArea.id && showDeckRenders
                    ? COLORS.purple50
                    : undefined
                }
              />
            </Fragment>
          )
        })}
      {/* all labware on deck NOT those in modules */}
      {Object.entries(labware).map(([id, lw]) => {
        if (
          Object.keys(modules).some(moduleId => lw.stack.includes(moduleId))
        ) {
          return null
        }
        const slot = getSlotInLocationStack(lw.stack)
        const slotPosition = getPositionFromSlotId(slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(slot, deckDef)
          ?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(
            `no slot ${slot} for labware ${Object.keys(labware)[0]}!`
          )
          return null
        }
        const isTiprack = labwareEntities[id].def.parameters.isTiprack
        const { copy, isActiveLayerVisible } = getActiveLayer(
          isTiprack,
          Object.values(pipettes),
          id,
          selectedRunTimeCommand
        )
        const isActive = selectedSlot === slot || hoveredSlot === slot

        return (
          <Fragment key={id}>
            {showDeckRenders ? (
              <LabwareOnDeck
                x={slotPosition[0]}
                y={slotPosition[1]}
                robotState={robotState}
                labwareDef={labwareEntities[id].def}
                liquids={liquids}
                labwareId={id}
                setSelectedSlot={setSelectedSlot}
                setHoveredSlot={setHoveredSlot}
              />
            ) : (
              <>
                <RobotCoordsForeignDiv
                  x={slotPosition[0]}
                  y={slotPosition[1]}
                  width={`${STANDARD_X_WIDTH}px`}
                  height={`${STANDARD_Y_HEIGHT}px`}
                  dataTestId={id}
                  innerDivProps={{
                    cursor: 'pointer',
                    transform: 'rotate(180deg) scaleX(-1)',
                  }}
                  innerDivEvents={{
                    onClick: () => {
                      setSelectedSlot(slot)
                    },
                    onMouseEnter: () => {
                      setHoveredSlot(slot)
                    },
                    onMouseLeave: () => {
                      setHoveredSlot(null)
                    },
                  }}
                >
                  <div
                    className={clsx(
                      styles.slot_box,
                      !showDeckRenders && styles.dont_show_render_slot_box,
                      isActive && styles.hovered_inactive_slot_box
                    )}
                  >
                    {showDeckRenders &&
                    hoveredSlot !== slot &&
                    selectedSlot !== slot ? null : (
                      <StyledText
                        desktopStyle="captionRegular"
                        color={COLORS.white}
                      >
                        {labwareEntitiesExtended[id].nickName ??
                          labwareEntitiesExtended[id].def.metadata.displayName}
                      </StyledText>
                    )}
                  </div>
                </RobotCoordsForeignDiv>
                {isActiveLayerVisible ? (
                  <DeckViewOverlay
                    key={`${slot}_activeSlot_labware`}
                    slotId={slot}
                    slotPosition={slotPosition}
                    slotFillColor={isActive ? COLORS.purple60 : COLORS.purple50}
                    opacity={0.9}
                    robotType={robotType}
                    invariantContext={invariantContext}
                    robotState={robotState}
                    setSelectedSlot={setSelectedSlot}
                    setHoveredSlot={setHoveredSlot}
                  >
                    <StyledText
                      desktopStyle="captionSemiBold"
                      color={COLORS.white}
                    >
                      {/* TODO: for user-testing purposes, only some copy is filled out but
                  if we decide to keep this concept, we should consider adding each command copy to
                  the command result or something */}
                      {copy}
                    </StyledText>
                  </DeckViewOverlay>
                ) : null}
              </>
            )}
          </Fragment>
        )
      })}
      {/* all nested labwares */}
      {Object.entries(labware).map(([id, lw]) => {
        if (
          Object.keys(modules).some(moduleId => lw.stack.includes(moduleId))
        ) {
          return null
        }
        if (
          deckDef.locations.addressableAreas.some(addressableArea =>
            lw.stack.includes(addressableArea.id)
          )
        ) {
          return null
        }
        const slotForOnTheDeck = getSlotInLocationStack(lw.stack)
        const moduleId = Object.values(moduleEntities).find(
          mod => mod.id === slotForOnTheDeck
        )?.id
        const slotForOnMod = moduleId != null ? modules[moduleId].slot : null
        let slotPosition = null
        if (slotForOnMod != null) {
          slotPosition = getPositionFromSlotId(slotForOnMod, deckDef)
        } else if (slotForOnTheDeck != null) {
          slotPosition = getPositionFromSlotId(slotForOnTheDeck, deckDef)
        }
        if (slotPosition == null) {
          console.warn(
            `no slot ${slotForOnTheDeck} for labware ${
              Object.keys(labware)[0]
            }!`
          )
          return null
        }
        const isTiprack = labwareEntities[id].def.parameters.isTiprack
        const { copy, isActiveLayerVisible } = getActiveLayer(
          isTiprack,
          Object.values(pipettes),
          id,
          selectedRunTimeCommand
        )
        const isActive =
          selectedSlot === slotForOnTheDeck || hoveredSlot === slotForOnTheDeck

        return (
          <Fragment key={id}>
            {showDeckRenders ? (
              <LabwareOnDeck
                x={slotPosition[0]}
                y={slotPosition[1]}
                robotState={robotState}
                labwareDef={labwareEntities[id].def}
                liquids={liquids}
                labwareId={id}
                setSelectedSlot={setSelectedSlot}
                setHoveredSlot={setHoveredSlot}
              />
            ) : (
              <>
                <RobotCoordsForeignDiv
                  x={slotPosition[0]}
                  y={slotPosition[1]}
                  width={`${STANDARD_X_WIDTH}px`}
                  height={`${STANDARD_Y_HEIGHT}px`}
                  innerDivProps={{
                    cursor: 'pointer',
                    transform: 'rotate(180deg) scaleX(-1)',
                  }}
                  innerDivEvents={{
                    onClick: () => {
                      setSelectedSlot(slotForOnTheDeck)
                    },
                    onMouseEnter: () => {
                      setHoveredSlot(slotForOnTheDeck)
                    },
                    onMouseLeave: () => {
                      setHoveredSlot(null)
                    },
                  }}
                >
                  <div
                    className={clsx(
                      styles.slot_box,
                      !showDeckRenders && styles.dont_show_render_slot_box,
                      isActive && styles.hovered_inactive_slot_box
                    )}
                  >
                    {showDeckRenders &&
                    hoveredSlot !== slotForOnTheDeck &&
                    selectedSlot !== slotForOnTheDeck ? null : (
                      <StyledText
                        desktopStyle="captionRegular"
                        color={COLORS.white}
                      >
                        {labwareEntitiesExtended[id].nickName ??
                          labwareEntitiesExtended[id].def.metadata.displayName}
                      </StyledText>
                    )}
                  </div>
                </RobotCoordsForeignDiv>
                {isActiveLayerVisible ? (
                  <DeckViewOverlay
                    key={`${slotForOnTheDeck}_activeSlot_adapter`}
                    slotId={slotForOnTheDeck}
                    slotPosition={slotPosition}
                    slotFillColor={isActive ? COLORS.purple60 : COLORS.purple50}
                    opacity={0.9}
                    robotType={robotType}
                    invariantContext={invariantContext}
                    robotState={robotState}
                    setSelectedSlot={setSelectedSlot}
                    setHoveredSlot={setHoveredSlot}
                  >
                    <StyledText
                      desktopStyle="captionRegular"
                      color={COLORS.white}
                    >
                      {/* TODO: for user-testing purposes, only some copy is filled out but
                  if we decide to keep this concept, we should consider adding each command copy to
                  the command result or something */}
                      {copy}
                    </StyledText>
                  </DeckViewOverlay>
                ) : null}
              </>
            )}
          </Fragment>
        )
      })}
    </>
  )
}

const getSlotColorClass = (
  hoveredSlot: string | null,
  selectedSlot: string | null,
  slot: string,
  isSlotSelected: boolean
): string => {
  if (hoveredSlot === slot && isSlotSelected) {
    return styles.hovered_active_slot_box
  } else if (hoveredSlot === slot && !isSlotSelected) {
    return styles.hovered_inactive_slot_box
  } else if (selectedSlot === slot && isSlotSelected) {
    return styles.hovered_active_slot_box
  } else if (selectedSlot === slot && !isSlotSelected) {
    return styles.hovered_inactive_slot_box
  } else if (isSlotSelected) {
    return styles.active_slot_box
  }
  return ''
}
