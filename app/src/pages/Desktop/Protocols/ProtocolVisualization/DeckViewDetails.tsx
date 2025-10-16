import { Fragment } from 'react'

import {
  COLORS,
  Module,
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

import { POTENTIAL_TRASH_COMMAND_TYPES } from './DeckView'
import { DeckViewOverlay } from './DeckViewOverlay'
import { FixtureCommandSummary } from './FixtureCommandSummary'
import { LabwareCommandSummary } from './LabwareCommandSummary'
import { LabwareOnDeck } from './LabwareOnDeck'
import { ModuleCommandSummary } from './ModuleCommandSummary'
import {
  getActiveLayer,
  getSlotIdsBlockedBySpanningForThermocycler,
  getSlotIsEmpty,
  getStagingAreaAddressableAreas,
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
    liquids,
    labwareEntitiesExtended,
  } = props
  const { labware, modules } = robotState
  const { labwareEntities, moduleEntities, trashBinEntities } = invariantContext
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    modules,
    moduleEntities,
    robotType
  )
  const trashSlots = Object.values(trashBinEntities).map(
    trash => trash.location.split('cutout')[1]
  )
  const trashId = Object.values(robotState.pipettes).find(
    pipette =>
      pipette.entityId != null && trashBinEntities[pipette.entityId] != null
  )?.entityId
  const isPipetteOverTrash =
    trashId != null &&
    selectedRunTimeCommand != null &&
    POTENTIAL_TRASH_COMMAND_TYPES.includes(selectedRunTimeCommand.commandType)
  const trashSlotWherePipetteIsOver =
    trashId != null ? trashBinEntities[trashId].location : null
  const trashAddressableArea =
    trashSlotWherePipetteIsOver != null
      ? getAddressableAreaFromSlotId(
          trashSlotWherePipetteIsOver.split('cutout')[1],
          deckDef
        )
      : null
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
        const { isActiveLayerVisible } = getActiveLayer(
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
        const innerTCProps = {
          ...tempInnerProps,
          lidMotorState:
            (tempInnerProps as ThermocyclerVizProps)?.lidMotorState !== 'open'
              ? 'closed'
              : 'open',
        }

        const fixtureBaseColor =
          isStepAssosciatedWithModule || isActiveLayerVisible
            ? COLORS.purple30
            : COLORS.grey35
        let strokeColor = 'none'

        if (
          hoveredSlot === slot ||
          (moduleType === THERMOCYCLER_MODULE_TYPE && hoveredSlot === 'B1')
        ) {
          strokeColor = COLORS.purple50
        }
        return (
          <Fragment key={id}>
            {
              <>
                {moduleType === THERMOCYCLER_MODULE_TYPE ? (
                  <SingleSlotFixture
                    key="A1"
                    cutoutId="cutoutA1"
                    deckDefinition={deckDef}
                    showExpansion={true}
                    fixtureBaseColor={fixtureBaseColor}
                    slotClipColor={COLORS.grey60}
                    stroke={strokeColor}
                  />
                ) : null}
                <SingleSlotFixture
                  key={slot}
                  cutoutId={`cutout${slot}` as CutoutId}
                  deckDefinition={deckDef}
                  showExpansion={false}
                  fixtureBaseColor={fixtureBaseColor}
                  slotClipColor={COLORS.grey60}
                  stroke={strokeColor}
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
                    <>
                      <LabwareOnDeck
                        robotState={robotState}
                        labwareDef={
                          labwareEntities[labwareLoadedOnModuleId].def
                        }
                        liquids={liquids}
                        labwareId={labwareLoadedOnModuleId}
                        x={0}
                        y={0}
                        setSelectedSlot={setSelectedSlot}
                        setHoveredSlot={setHoveredSlot}
                      />
                      {hoveredSlot === slot ? (
                        moduleType === THERMOCYCLER_MODULE_TYPE ? (
                          <DeckViewOverlay
                            key={slot}
                            slotId={slot}
                            slotPosition={[0, 0, 0]}
                            opacity={0.9}
                            slotFillColor={COLORS.purple50}
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
                              {
                                labwareEntities[labwareLoadedOnModuleId].def
                                  .metadata.displayName
                              }
                            </StyledText>
                          </DeckViewOverlay>
                        ) : (
                          <DeckViewOverlay
                            key={slot}
                            slotId={slot}
                            slotPosition={slotPosition}
                            opacity={0.9}
                            slotFillColor={COLORS.purple50}
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
                              {labwareEntitiesExtended[id].nickName ??
                                labwareEntities[labwareLoadedOnModuleId].def
                                  .metadata.displayName}
                            </StyledText>
                          </DeckViewOverlay>
                        )
                      ) : null}
                    </>
                  ) : null}
                </Module>
                {(isActiveLayerVisible || isStepAssosciatedWithModule) &&
                selectedRunTimeCommand != null ? (
                  <ModuleCommandSummary
                    robotType={robotType}
                    moduleModel={moduleDef.model}
                    commandType={selectedRunTimeCommand.commandType}
                    position={slotPosition}
                    showModuleIcon={false}
                    slot={slot}
                    orientation={inferModuleOrientationFromXCoordinate(
                      slotPosition[0]
                    )}
                  />
                ) : null}
              </>
            }
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
                fixtureBaseColor={COLORS.transparent}
                stroke={
                  hoveredSlot === addressableArea.id ? COLORS.purple50 : 'none'
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
        const { isActiveLayerVisible } = getActiveLayer(
          id,
          selectedRunTimeCommand
        )
        return (
          <Fragment key={id}>
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
            {hoveredSlot === slot ? (
              <DeckViewOverlay
                key={`${slot}_hoveredSlot_labware`}
                slotId={slot}
                slotPosition={slotPosition}
                slotFillColor={COLORS.purple50}
                opacity={0.9}
                robotType={robotType}
                invariantContext={invariantContext}
                robotState={robotState}
                setSelectedSlot={setSelectedSlot}
                setHoveredSlot={setHoveredSlot}
              >
                <StyledText desktopStyle="captionRegular" color={COLORS.white}>
                  {labwareEntitiesExtended[id].nickName ??
                    labwareEntities[id].def.metadata.displayName}
                </StyledText>
              </DeckViewOverlay>
            ) : null}
            {isActiveLayerVisible && selectedRunTimeCommand != null ? (
              <LabwareCommandSummary
                commandType={selectedRunTimeCommand.commandType}
                position={slotPosition}
                labwareDef={labwareEntities[id].def}
                showModuleIcon={false}
              />
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
        const { isActiveLayerVisible } = getActiveLayer(
          id,
          selectedRunTimeCommand
        )

        return (
          <Fragment key={id}>
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
            {hoveredSlot === slotForOnTheDeck ? (
              <DeckViewOverlay
                key={`${slotForOnTheDeck}_hoveredSlot_labware`}
                slotId={slotForOnTheDeck}
                slotPosition={slotPosition}
                slotFillColor={COLORS.purple50}
                opacity={0.9}
                robotType={robotType}
                invariantContext={invariantContext}
                robotState={robotState}
                setSelectedSlot={setSelectedSlot}
                setHoveredSlot={setHoveredSlot}
              >
                <StyledText desktopStyle="captionRegular" color={COLORS.white}>
                  {labwareEntitiesExtended[id].nickName ??
                    labwareEntities[id].def.metadata.displayName}
                </StyledText>
              </DeckViewOverlay>
            ) : null}
            {isActiveLayerVisible && selectedRunTimeCommand != null ? (
              <LabwareCommandSummary
                commandType={selectedRunTimeCommand.commandType}
                position={slotPosition}
                labwareDef={labwareEntities[id].def}
                showModuleIcon={false}
              />
            ) : null}
          </Fragment>
        )
      })}

      {/* when commandSummary happens on a fixture */}
      {isPipetteOverTrash &&
      selectedRunTimeCommand != null &&
      trashAddressableArea != null ? (
        <FixtureCommandSummary
          commandType={selectedRunTimeCommand.commandType}
          slotPosition={getPositionFromSlotId(trashAddressableArea.id, deckDef)}
          slotBoundingBox={trashAddressableArea.boundingBox}
        />
      ) : null}
    </>
  )
}
