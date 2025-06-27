import { Dispatch, Fragment, SetStateAction } from 'react'

import {
  BORDERS,
  Box,
  COLORS,
  RobotCoordsForeignDiv,
  StyledText,
} from '@opentrons/components'
import {
  CutoutId,
  DeckDefinition,
  getAddressableAreaFromSlotId,
  getModuleDef2,
  getPositionFromSlotId,
  isAddressableAreaStandardSlot,
  RobotType,
  RunTimeCommand,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  InvariantContext,
  LabwareTemporalProperties,
  TimelineFrame,
} from '@opentrons/step-generation'

import { DeckViewOverlay } from './DeckViewOverlay'
import {
  getSlotIdsBlockedBySpanningForThermocycler,
  getSlotIsEmpty,
  getStagingAreaAddressableAreas,
} from './utils'

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
  isSlotActive: boolean
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
    isSlotActive,
    selectedRunTimeCommand,
  } = props
  const { labware, modules, pipettes } = robotState
  const { labwareEntities, moduleEntities } = invariantContext
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    modules,
    moduleEntities,
    robotType
  )

  console.log('selectedSlot', selectedSlot)
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
        const isStepAssosciatedWithLabware = Object.values(pipettes).find(
          pipette => pipette.entityId === labwareLoadedOnModuleId
        )
        console.log(pipettes)
        return (
          <Fragment key={id}>
            <DeckViewOverlay
              key={slot}
              slotId={slot}
              slotPosition={slotPosition}
              slotFillColor={
                selectedSlot === slot ? COLORS.grey60 : COLORS.grey55
              }
              robotType={robotType}
              invariantContext={invariantContext}
              robotState={robotState}
              setSelectedSlot={setSelectedSlot}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE ? (
                  <div style={{ marginBottom: '6rem' }}>
                    <StyledText desktopStyle="bodyLargeRegular" color="white">
                      {getModuleDef2(moduleEntities[id].model).displayName}
                    </StyledText>
                  </div>
                ) : null}
                {labwareLoadedOnModuleId != null ? (
                  <>
                    <RobotCoordsForeignDiv>
                      <Box
                        backgroundColor={
                          isStepAssosciatedWithLabware
                            ? COLORS.purple40
                            : COLORS.grey50
                        }
                        border="3px solid black"
                        borderRadius={BORDERS.borderRadius8}
                        width={`${STANDARD_X_WIDTH}px`}
                        height={`${STANDARD_Y_HEIGHT}px`}
                        padding="8px"
                      >
                        <StyledText
                          desktopStyle="captionRegular"
                          transform={`rotate(180deg) scaleX(-1)`}
                          color="white"
                        >
                          {
                            labwareEntities[labwareLoadedOnModuleId].def
                              .metadata.displayName
                          }
                        </StyledText>
                      </Box>
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
                slotFillColor={
                  selectedSlot === slot ? COLORS.purple40 : COLORS.purple50
                }
                robotType={robotType}
                invariantContext={invariantContext}
                robotState={robotState}
                setSelectedSlot={setSelectedSlot}
              >
                <StyledText desktopStyle="bodyLargeRegular">
                  Thermocycler changing state
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
            getSlotIsEmpty(robotState, addressableArea.id)
          )
        })
        .map(addressableArea => {
          return (
            <DeckViewOverlay
              key={addressableArea.id}
              slotId={addressableArea.id}
              slotPosition={getPositionFromSlotId(addressableArea.id, deckDef)}
              slotFillColor={COLORS.transparent}
              robotType={robotType}
              invariantContext={invariantContext}
              robotState={robotState}
              setSelectedSlot={setSelectedSlot}
            >
              <div></div>
            </DeckViewOverlay>
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
          console.warn(`no slot ${slot} for labware ${labware.id}!`)
          return null
        }
        const isStepAssosciatedWithLabwareState = Object.values(pipettes).find(
          pipette => pipette.entityId === id || pipette.tiprackId === id
        )
        const isStepAssosciatedWithLabwareId =
          selectedRunTimeCommand != null &&
          (('labwareId' in selectedRunTimeCommand.params &&
            selectedRunTimeCommand.params.labwareId === id) ||
            ('newLocation' in selectedRunTimeCommand.params &&
              selectedRunTimeCommand.params.newLocation?.labwareId === id))

        const isStepAssosciatedWithLabware =
          isStepAssosciatedWithLabwareState || isStepAssosciatedWithLabwareId

        let backgroundColor = COLORS.grey50

        if (selectedSlot === slot && isStepAssosciatedWithLabware) {
          backgroundColor = COLORS.purple60
        } else if (selectedSlot === slot && !isStepAssosciatedWithLabware) {
          backgroundColor = COLORS.grey60
        } else if (isStepAssosciatedWithLabware) {
          backgroundColor = COLORS.purple40
        }

        return (
          <Fragment key={id}>
            <RobotCoordsForeignDiv
              x={slotPosition[0]}
              y={slotPosition[1]}
              innerDivProps={{
                style: {
                  cursor: 'pointer',
                },
                transform: 'rotate(180deg) scaleX(-1)',
                onClick: () => {
                  setSelectedSlot(slot)
                },
              }}
            >
              <Box
                backgroundColor={backgroundColor}
                border="3px solid black"
                borderRadius={BORDERS.borderRadius8}
                width={`${STANDARD_X_WIDTH}px`}
                height={`${STANDARD_Y_HEIGHT}px`}
                padding="8px"
              >
                <StyledText desktopStyle="captionRegular" color="white">
                  {labwareEntities[id].def.metadata.displayName}
                </StyledText>
              </Box>
            </RobotCoordsForeignDiv>
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
          console.warn(`no slot ${slotForOnTheDeck} for labware ${labware.id}!`)
          return null
        }
        const isStepAssosciatedWithLabwareState = Object.values(pipettes).find(
          pipette => pipette.entityId === id || pipette.tiprackId === id
        )
        const isStepAssosciatedWithLabwareId =
          selectedRunTimeCommand != null &&
          (('labwareId' in selectedRunTimeCommand.params &&
            selectedRunTimeCommand.params.labwareId === id) ||
            ('newLocation' in selectedRunTimeCommand.params &&
              selectedRunTimeCommand.params.newLocation?.labwareId === id))

        const isStepAssosciatedWithLabware =
          isStepAssosciatedWithLabwareState || isStepAssosciatedWithLabwareId

        let backgroundColor = COLORS.grey50

        if (selectedSlot === slotForOnTheDeck && isStepAssosciatedWithLabware) {
          backgroundColor = COLORS.purple60
        } else if (
          selectedSlot === slotForOnTheDeck &&
          !isStepAssosciatedWithLabware
        ) {
          backgroundColor = COLORS.grey60
        } else if (isStepAssosciatedWithLabware) {
          backgroundColor = COLORS.purple40
        }

        return (
          <Fragment key={id}>
            <RobotCoordsForeignDiv
              x={slotPosition[0]}
              y={slotPosition[1]}
              innerDivProps={{
                style: {
                  cursor: 'pointer',
                },
                transform: 'rotate(180deg) scaleX(-1)',
                onClick: () => {
                  setSelectedSlot(slotForOnTheDeck)
                },
              }}
            >
              <Box
                backgroundColor={backgroundColor}
                border="3px solid black"
                borderRadius={BORDERS.borderRadius8}
                width={`${STANDARD_X_WIDTH}px`}
                height={`${STANDARD_Y_HEIGHT}px`}
                padding="8px"
              >
                <StyledText desktopStyle="captionRegular" color="white">
                  {labwareEntities[id].def.metadata.displayName}
                </StyledText>
              </Box>
            </RobotCoordsForeignDiv>
          </Fragment>
        )
      })}
    </>
  )
}

export const getTopmostLabwareOnModuleFromStack = (
  moduleId: string,
  labware: LabwareTemporalProperties[]
): string => {
  return labware
    .filter(lw => lw.stack.includes(moduleId)) // all stacks involving this module
    .sort((a, b) => b.stack.length - a.stack.length)[0]?.stack[0] // return topmost labware from largest stack
}
