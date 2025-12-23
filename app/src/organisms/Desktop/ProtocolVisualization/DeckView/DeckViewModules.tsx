import { Fragment } from 'react'

import {
  CenterLabwareInModuleChildSlot,
  COLORS,
  Module,
  StyledText,
} from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  getModuleDef,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getActiveLayer } from '../utils/getActiveLayer'
import { getModuleInnerProps } from '../utils/getModuleInnerProps'
import { getTopmostLabwareOnModuleFromStack } from '../utils/getTopmostLabwareOnModuleFromStack'
import { DeckViewOverlay } from './DeckViewOverlay'
import { LabwareOnDeck } from './LabwareOnDeck'
import { ModuleCommandSummary } from './ModuleCommandSummary'

import type { Dispatch, SetStateAction } from 'react'
import type { ThermocyclerVizProps } from '@opentrons/components'
import type {
  DeckDefinition,
  Liquid,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
import type { LabwareEntityExtended } from '../../../../organisms/Desktop/ProtocolVisualization/DeckView'

interface DeckViewModulesProps {
  robotState: RobotState
  invariantContext: InvariantContext
  liquids: Liquid[]
  deckDef: DeckDefinition
  robotType: RobotType
  labwareEntitiesExtended: Record<string, LabwareEntityExtended>
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
  hoveredSlot: string | null
  selectedRunTimeCommand?: RunTimeCommand
}

export function DeckViewModules(props: DeckViewModulesProps): JSX.Element {
  const {
    robotState,
    invariantContext,
    liquids,
    deckDef,
    robotType,
    setHoveredSlot,
    setSelectedSlot,
    hoveredSlot,
    labwareEntitiesExtended,
    selectedRunTimeCommand,
  } = props
  const { moduleEntities } = invariantContext
  const { modules, labware } = robotState

  return (
    <>
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
        const tempInnerProps = getModuleInnerProps(moduleState)
        const innerTCProps = {
          ...tempInnerProps,
          lidMotorState:
            (tempInnerProps as ThermocyclerVizProps)?.lidMotorState !== 'open'
              ? 'closed'
              : 'open',
        }
        const showModuleCommandSummary =
          (isActiveLayerVisible || isStepAssosciatedWithModule) &&
          selectedRunTimeCommand != null

        return (
          <Fragment key={id}>
            <>
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
                childrenPositioningMode="passThrough"
                setSelectedSlot={setSelectedSlot}
                setHoveredSlot={setHoveredSlot}
              >
                {labwareLoadedOnModuleId != null ? (
                  <>
                    <CenterLabwareInModuleChildSlot
                      deckId={deckDef.otId}
                      slotId={slot}
                      moduleDefinition={moduleDef}
                      labwareDefinition={
                        labwareEntitiesExtended[labwareLoadedOnModuleId].def
                      }
                    >
                      <LabwareOnDeck
                        robotState={robotState}
                        labwareDef={
                          labwareEntitiesExtended[labwareLoadedOnModuleId].def
                        }
                        liquids={liquids}
                        labwareId={labwareLoadedOnModuleId}
                        x={
                          0 + (moduleType === FLEX_STACKER_MODULE_TYPE ? 17 : 0)
                        }
                        y={0}
                        setSelectedSlot={setSelectedSlot}
                        setHoveredSlot={setHoveredSlot}
                      />
                    </CenterLabwareInModuleChildSlot>
                    {moduleType === THERMOCYCLER_MODULE_TYPE ? (
                      <DeckViewOverlay
                        key={slot}
                        slotId={slot}
                        slotPosition={[0, 0, 0]}
                        slotFillColor={COLORS.purple50}
                        robotType={robotType}
                        invariantContext={invariantContext}
                        robotState={robotState}
                        setSelectedSlot={setSelectedSlot}
                        setHoveredSlot={setHoveredSlot}
                        hover={hoveredSlot}
                      >
                        {showModuleCommandSummary ? null : (
                          <StyledText
                            desktopStyle="captionRegular"
                            color={COLORS.white}
                          >
                            {
                              labwareEntitiesExtended[labwareLoadedOnModuleId]
                                .def.metadata.displayName
                            }
                          </StyledText>
                        )}
                      </DeckViewOverlay>
                    ) : (
                      <DeckViewOverlay
                        key={slot}
                        slotId={slot}
                        slotPosition={slotPosition}
                        slotFillColor={COLORS.purple50}
                        robotType={robotType}
                        invariantContext={invariantContext}
                        robotState={robotState}
                        setSelectedSlot={setSelectedSlot}
                        setHoveredSlot={setHoveredSlot}
                        hover={hoveredSlot}
                      >
                        {showModuleCommandSummary ? null : (
                          <StyledText
                            desktopStyle="captionRegular"
                            color={COLORS.white}
                          >
                            {labwareEntitiesExtended[id]?.nickName ??
                              labwareEntitiesExtended[labwareLoadedOnModuleId]
                                .def.metadata.displayName}
                          </StyledText>
                        )}
                      </DeckViewOverlay>
                    )}
                  </>
                ) : null}
                <DeckViewOverlay
                  key={slot}
                  slotId={slot}
                  slotPosition={[0, 0, 0]}
                  slotFillColor={COLORS.purple50}
                  robotType={robotType}
                  invariantContext={invariantContext}
                  robotState={robotState}
                  setSelectedSlot={setSelectedSlot}
                  setHoveredSlot={setHoveredSlot}
                  hover={hoveredSlot}
                />
              </Module>
              {showModuleCommandSummary ? (
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
          </Fragment>
        )
      })}
    </>
  )
}
