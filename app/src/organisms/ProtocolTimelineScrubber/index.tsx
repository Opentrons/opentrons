import * as React from 'react'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import isEmpty from 'lodash/isEmpty'
import {
  RobotWorkSpace,
  Module,
  LabwareRender,
  Flex,
  Text,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'
import { createTimelineFromRunCommands } from '@opentrons/step-generation'
import {
  inferModuleOrientationFromXCoordinate,
  getModuleDef2,
} from '@opentrons/shared-data'

import type { RunTimeCommand } from '@opentrons/shared-data'

interface ProtocolTimelineScrubberProps {
  commands: RunTimeCommand[]
}

export const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]
export const VIEWBOX_MIN_X = -64
export const VIEWBOX_MIN_Y = -10
export const VIEWBOX_WIDTH = 520
export const VIEWBOX_HEIGHT = 414

export function ProtocolTimelineScrubber(
  props: ProtocolTimelineScrubberProps
): JSX.Element {
  const deckDef = React.useMemo(() => getDeckDefinitions().ot2_standard, [])
  const { commands } = props
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )

  const { timeline, invariantContext } = createTimelineFromRunCommands(commands)
  const currentCommandTimelineFrame = timeline[currentCommandIndex]
  const { robotState, command } = currentCommandTimelineFrame

  return (
    <Flex size="650px" flexDirection={DIRECTION_COLUMN}>
      <input
        type="range"
        min={0}
        max={commands.length - 1}
        value={currentCommandIndex}
        onChange={e => setCurrentCommandIndex(Number(e.target.value))}
      />

      <Text as="h3">Current Command</Text>
      <Text marginLeft={SPACING.spacing3}>index: {currentCommandIndex}</Text>
      <Text marginLeft={SPACING.spacing3}>type: {command.commandType}</Text>
      {/*
      <ul marginLeft={SPACING.spacing3}>
        props:
        {Object.entries(command.result).map(([key, value]) => (
          <li key={key}>
            {key}: {value.toString()}
          </li>
        ))}
      </ul> */}
      {/* <Text>{JSON.stringify(robotState.liquidState.labware)}</Text> */}
      <RobotWorkSpace
        deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
        deckDef={deckDef}
        viewBox={`${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        {({ deckSlotsById, getRobotCoordsFromDOMCoords }) => (
          <>
            {map(robotState.modules, (module, moduleId) => {
              const slot = deckSlotsById[module.slot]
              const labwareInModuleId =
                Object.entries(robotState.labware).find(
                  ([labwareId, labware]) => labware.slot === moduleId
                )?.[0] ?? null
              const wellFill = reduce(
                robotState.liquidState.labware[labwareInModuleId] ?? {},
                (acc, liquidLocation, wellName) => {
                  if (!isEmpty(liquidLocation)) {
                    return {
                      ...acc,
                      [wellName]:
                        command.params.displayColor ?? 'rebeccapurple',
                    }
                  }
                  return acc
                },
                {}
              )
              return (
                <Module
                  x={slot.position[0]}
                  y={slot.position[1]}
                  orientation={inferModuleOrientationFromXCoordinate(
                    slot.position[0]
                  )}
                  def={getModuleDef2(
                    invariantContext.moduleEntities[moduleId].model
                  )}
                  innerProps={{}} // TODO: wire up module state
                >
                  {labwareInModuleId != null ? (
                    <LabwareRender
                      definition={
                        invariantContext.labwareEntities[labwareInModuleId].def
                      }
                      wellFill={wellFill}
                    />
                  ) : null}
                </Module>
              )
            })}
            {map(robotState.labware, (labware, labwareId) => {
              if (
                labware.slot in robotState.modules ||
                labwareId === 'fixedTrash'
              )
                return null
              const slot = deckSlotsById[labware.slot]
              const definition = invariantContext.labwareEntities[labwareId].def

              const missingTips = definition.parameters.isTiprack ? reduce(
                robotState.tipState.tipracks[labwareId],
                (acc, hasTip, wellName) => {
                  if (!hasTip) return { ...acc, [wellName]: null }
                  return acc
                },
                {}
              ) : {}

              const wellFill = reduce(
                robotState.liquidState.labware[labwareId],
                (acc, liquidLocation, wellName) => {
                  if (!isEmpty(liquidLocation)) {
                    return {
                      ...acc,
                      [wellName]:
                        command.params.displayColor ?? 'rebeccapurple',
                    }
                  }
                  return acc
                },
                {}
              )
              return (
                <g
                  transform={`translate(${slot.position[0]},${slot.position[1]})`}
                >
                  <LabwareRender definition={definition} wellFill={wellFill} missingTips={missingTips} />
                </g>
              )
            })}
          </>
        )}
      </RobotWorkSpace>
    </Flex>
  )
}
