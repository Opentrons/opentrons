import { Fragment } from 'react'

import { COLORS, Module } from '@opentrons/components'
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
import { DeckViewStacker } from './DeckViewStacker'

import type { Dispatch, SetStateAction } from 'react'
import type { ThermocyclerVizProps } from '@opentrons/components'
import type {
  DeckDefinition,
  Liquid,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
import type { LabwareEntityExtended } from './index'

const FLEX_STACKER_SLOT_POSITION = 178

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
  const { modules, labware, pipettes } = robotState

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
        const { isActiveLayerVisible } = getActiveLayer(
          labwareLoadedOnModuleId,
          pipettes,
          selectedRunTimeCommand,
          id
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
        const isThermocyclerLidClosed =
          moduleType === THERMOCYCLER_MODULE_TYPE &&
          innerTCProps.lidMotorState === 'closed'
        const isSelectedCommandForThisModule =
          selectedRunTimeCommand != null &&
          'moduleId' in selectedRunTimeCommand.params &&
          selectedRunTimeCommand.params.moduleId === id

        const showLabwareCommandSummary =
          isSelectedCommandForThisModule && labwareLoadedOnModuleId != null

        const showModuleCommandSummary =
          (isActiveLayerVisible || isSelectedCommandForThisModule) &&
          selectedRunTimeCommand != null &&
          !showLabwareCommandSummary
        return (
          <Fragment key={id}>
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
              targetSlotId={
                moduleType === FLEX_STACKER_MODULE_TYPE ? `hopper${slot}` : slot
              }
              targetDeckId={deckDef.otId}
              childrenPositioningMode="passThrough"
              setSelectedSlot={setSelectedSlot}
              setHoveredSlot={setHoveredSlot}
            >
              {labwareLoadedOnModuleId != null ? (
                <DeckViewStacker
                  robotState={robotState}
                  invariantContext={invariantContext}
                  liquids={liquids}
                  deckDef={deckDef}
                  robotType={robotType}
                  setHoveredSlot={setHoveredSlot}
                  setSelectedSlot={setSelectedSlot}
                  slot={slot}
                  slotPosition={slotPosition}
                  moduleType={moduleType}
                  moduleDef={moduleDef}
                  showLabwareCommandSummary={showLabwareCommandSummary}
                  labwareLoadedOnModuleId={labwareLoadedOnModuleId}
                  showModuleCommandSummary={showModuleCommandSummary}
                  hoveredSlot={hoveredSlot}
                  labwareEntitiesExtended={labwareEntitiesExtended}
                  selectedRunTimeCommand={selectedRunTimeCommand}
                  renderLabware={!isThermocyclerLidClosed}
                />
              ) : null}
              <DeckViewOverlay
                key={slot}
                slotId={
                  moduleType === FLEX_STACKER_MODULE_TYPE
                    ? `hopper${slot}`
                    : slot
                }
                slotPosition={[
                  moduleType === FLEX_STACKER_MODULE_TYPE
                    ? FLEX_STACKER_SLOT_POSITION
                    : 0,
                  0,
                  0,
                ]}
                slotFillColor={COLORS.purple50}
                robotType={robotType}
                invariantContext={invariantContext}
                robotState={robotState}
                setSelectedSlot={setSelectedSlot}
                setHoveredSlot={setHoveredSlot}
                hover={hoveredSlot}
              />
            </Module>
          </Fragment>
        )
      })}
    </>
  )
}
