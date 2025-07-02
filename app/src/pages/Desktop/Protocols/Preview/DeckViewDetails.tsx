import { Fragment } from 'react'
import clsx from 'clsx'

import {
  COLORS,
  RobotCoordsForeignDiv,
  SingleSlotFixture,
  StyledText,
} from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getModuleDef2,
  getPositionFromSlotId,
  isAddressableAreaStandardSlot,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { DeckViewOverlay } from './DeckViewOverlay'
import styles from './preview.module.css'
import {
  getActiveLayer,
  getSlotIdsBlockedBySpanningForThermocycler,
  getSlotIsEmpty,
  getStagingAreaAddressableAreas,
  getTopmostLabwareOnModuleFromStack,
} from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CutoutId,
  DeckDefinition,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  TimelineFrame,
} from '@opentrons/step-generation'

const STANDARD_X_WIDTH = 127.76
const STANDARD_Y_HEIGHT = 85.48

interface DeckViewDetailsProps {
  robotState: TimelineFrame
  robotType: RobotType
  selectedSlot: string | null
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  stagingAreaCutoutIds: CutoutId[]
  invariantContext: InvariantContext
  deckDef: DeckDefinition
  hoveredSlot: string | null
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
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
      {Object.entries(modules).map(([id, { slot }]) => {
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

        const isActive = selectedSlot === slot || hoveredSlot === slot
        return (
          <Fragment key={id}>
            <DeckViewOverlay
              key={slot}
              slotId={slot}
              slotPosition={slotPosition}
              slotFillColor={isActive ? COLORS.grey60 : COLORS.grey50}
              robotType={robotType}
              invariantContext={invariantContext}
              robotState={robotState}
              setSelectedSlot={setSelectedSlot}
              setHoveredSlot={setHoveredSlot}
            >
              <div className={styles.align_deck_modules}>
                {moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE ? (
                  <div className={styles.module_copy}>
                    <StyledText
                      desktopStyle="bodyLargeRegular"
                      color={COLORS.white}
                    >
                      {getModuleDef2(moduleEntities[id].model).displayName}
                    </StyledText>
                  </div>
                ) : null}
                {labwareLoadedOnModuleId != null ? (
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
                            : labwareEntities[labwareLoadedOnModuleId].def
                                .metadata.displayName}
                        </StyledText>
                      </div>
                    </RobotCoordsForeignDiv>
                  </>
                ) : null}
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
                  {selectedRunTimeCommand.commandType === 'loadModule'
                    ? 'Load Thermocycler'
                    : 'Thermocycler changing state'}
                </StyledText>
              </DeckViewOverlay>
            ) : null}
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
                  hoveredSlot === addressableArea.id
                    ? COLORS.grey40
                    : COLORS.transparent
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
            <RobotCoordsForeignDiv
              x={slotPosition[0]}
              y={slotPosition[1]}
              width={`${STANDARD_X_WIDTH}px`}
              height={`${STANDARD_Y_HEIGHT}px`}
              dataTestId={id}
              innerDivProps={{
                style: {
                  cursor: 'pointer',
                },
                transform: 'rotate(180deg) scaleX(-1)',
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
                  isActive && styles.hovered_inactive_slot_box
                )}
              >
                <StyledText desktopStyle="captionRegular" color={COLORS.white}>
                  {labwareEntities[id].def.metadata.displayName}
                </StyledText>
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
                <StyledText desktopStyle="captionSemiBold" color={COLORS.white}>
                  {copy}
                </StyledText>
              </DeckViewOverlay>
            ) : null}
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
            <RobotCoordsForeignDiv
              x={slotPosition[0]}
              y={slotPosition[1]}
              width={`${STANDARD_X_WIDTH}px`}
              height={`${STANDARD_Y_HEIGHT}px`}
              innerDivProps={{
                style: {
                  cursor: 'pointer',
                },
                transform: 'rotate(180deg) scaleX(-1)',
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
                  isActive && styles.hovered_inactive_slot_box
                )}
              >
                <StyledText desktopStyle="captionRegular" color={COLORS.white}>
                  {labwareEntities[id].def.metadata.displayName}
                </StyledText>
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
                <StyledText desktopStyle="captionRegular" color={COLORS.white}>
                  {copy}
                </StyledText>
              </DeckViewOverlay>
            ) : null}
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
