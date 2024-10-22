import { useMemo, useState, useEffect, useRef } from 'react'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import ViewportList from 'react-viewport-list'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_STRETCH,
  LegacyStyledText,
  BaseDeck,
  PrimaryButton,
  OVERFLOW_SCROLL,
  COLORS,
} from '@opentrons/components'
import { getResultingTimelineFrameFromRunCommands } from '@opentrons/step-generation'
import {
  FLEX_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  getSimplestDeckConfigForProtocol,
} from '@opentrons/shared-data'
import { PipetteMountViz } from './PipetteVisuals'
import {
  getAllWellContentsForActiveItem,
  wellFillFromWellContents,
} from './utils'
import { CommandItem } from './CommandItem'
import { getLabwareDefinitionsFromCommands } from '/app/local-resources/labware'

import type { ComponentProps } from 'react'
import type { ViewportListRef } from 'react-viewport-list'
import type {
  CompletedProtocolAnalysis,
  LabwareLocation,
  ProtocolAnalysisOutput,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { ModuleTemporalProperties } from '@opentrons/step-generation'
import type { LabwareOnDeck, Module } from '@opentrons/components'

const SEC_PER_FRAME = 1000
export const COMMAND_WIDTH_PX = 240

interface ProtocolTimelineScrubberProps {
  commands: RunTimeCommand[]
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  robotType?: RobotType
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
export const VIEWBOX_MIN_X = -84
export const VIEWBOX_MIN_Y = -10
export const VIEWBOX_WIDTH = 600
export const VIEWBOX_HEIGHT = 460

export function ProtocolTimelineScrubber(
  props: ProtocolTimelineScrubberProps
): JSX.Element {
  const { commands, analysis, robotType = FLEX_ROBOT_TYPE } = props
  const wrapperRef = useRef<HTMLDivElement>(null)
  const commandListRef = useRef<ViewportListRef>(null)
  const [currentCommandIndex, setCurrentCommandIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)

  const currentCommandsSlice = commands.slice(0, currentCommandIndex + 1)
  const { frame, invariantContext } = getResultingTimelineFrameFromRunCommands(
    currentCommandsSlice
  )
  const handlePlayPause = (): void => {
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    if (isPlaying) {
      const intervalId = setInterval(() => {
        setCurrentCommandIndex(prev => {
          const nextIndex = prev < commands.length - 1 ? prev + 1 : 0
          commandListRef.current?.scrollToIndex(nextIndex)
          return nextIndex
        })
      }, SEC_PER_FRAME)

      return () => {
        clearInterval(intervalId)
      }
    }
  }, [isPlaying, commands])

  const { robotState } = frame

  const [leftPipetteId] = Object.entries(robotState.pipettes).find(
    ([_pipetteId, pipette]) => pipette?.mount === 'left'
  ) ?? [null]
  const leftPipetteEntity =
    leftPipetteId != null
      ? invariantContext.pipetteEntities[leftPipetteId]
      : null

  const [rightPipetteId] = Object.entries(robotState.pipettes).find(
    ([_pipetteId, pipette]) => pipette?.mount === 'right'
  ) ?? [null]
  const rightPipetteEntity =
    rightPipetteId != null
      ? invariantContext.pipetteEntities[rightPipetteId]
      : null

  const allWellContentsForActiveItem = getAllWellContentsForActiveItem(
    invariantContext.labwareEntities,
    frame
  )
  const liquidDisplayColors = analysis.liquids.map(
    liquid => liquid.displayColor ?? COLORS.blue50
  )

  const isValidRobotSideAnalysis = analysis != null
  const allRunDefs = useMemo(
    () =>
      analysis != null
        ? getLabwareDefinitionsFromCommands(analysis.commands)
        : [],
    [isValidRobotSideAnalysis]
  )

  return (
    <Flex
      height="95vh"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
    >
      <Flex gridGap={SPACING.spacing8} flex="1 1 0">
        <Flex height="60vh">
          <BaseDeck
            robotType={robotType}
            deckConfig={getSimplestDeckConfigForProtocol(analysis)}
            modulesOnDeck={map(robotState.modules, (module, moduleId) => {
              const labwareInModuleId =
                Object.entries(robotState.labware).find(
                  ([labwareId, labware]) => labware.slot === moduleId
                )?.[0] ?? null

              const getModuleInnerProps = (
                moduleState: ModuleTemporalProperties['moduleState']
              ): ComponentProps<typeof Module>['innerProps'] => {
                if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
                  let lidMotorState = 'unknown'
                  if (moduleState.lidOpen === true) {
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

              const adapterId =
                labwareInModuleId != null
                  ? invariantContext.labwareEntities[labwareInModuleId].id
                  : null
              const labwareTempProperties =
                adapterId != null
                  ? Object.entries(robotState.labware).find(
                      ([labwareId, labware]) => labware.slot === adapterId
                    )
                  : null

              const labwareDef =
                labwareTempProperties != null
                  ? invariantContext.labwareEntities[labwareTempProperties[0]]
                      .def
                  : null
              let nestedDef
              let labwareId = null
              if (labwareDef != null && labwareTempProperties != null) {
                labwareId = labwareTempProperties[0]
                nestedDef = labwareDef
              } else if (labwareInModuleId != null) {
                labwareId = labwareInModuleId
                nestedDef =
                  invariantContext.labwareEntities[labwareInModuleId]?.def
              }

              const wellContents =
                allWellContentsForActiveItem && labwareId != null
                  ? allWellContentsForActiveItem[labwareId]
                  : null
              const nestedFill = wellFillFromWellContents(
                wellContents,
                liquidDisplayColors
              )

              return {
                moduleModel: invariantContext.moduleEntities[moduleId].model,
                moduleLocation: { slotName: module.slot },
                nestedLabwareDef: nestedDef,
                nestedLabwareWellFill: nestedFill,
                innerProps: getModuleInnerProps(module.moduleState),
              }
            })}
            labwareOnDeck={map(robotState.labware, (labware, labwareId) => {
              const definition = invariantContext.labwareEntities[labwareId].def

              const missingTips = definition.parameters.isTiprack
                ? reduce(
                    robotState.tipState.tipracks[labwareId],
                    (acc, hasTip, wellName) => {
                      if (!hasTip) return { ...acc, [wellName]: null }
                      return acc
                    },
                    {}
                  )
                : {}
              const labwareLocation: LabwareLocation = {
                slotName: labware.slot,
              }
              const wellContents =
                allWellContentsForActiveItem && labwareId != null
                  ? allWellContentsForActiveItem[labwareId]
                  : null
              const wellFill = wellFillFromWellContents(
                wellContents,
                liquidDisplayColors
              )
              const labwareOnDeck: LabwareOnDeck = {
                labwareLocation,
                definition,
                wellFill,
                missingTips,
              }

              return labwareOnDeck
            }).filter((i): i is LabwareOnDeck => i != null)}
          />
        </Flex>
        <PipetteMountViz
          mount="left"
          pipetteId={leftPipetteId}
          pipetteEntity={leftPipetteEntity}
          timelineFrame={frame.robotState}
          analysis={analysis}
        />
        <PipetteMountViz
          mount="right"
          pipetteId={rightPipetteId}
          pipetteEntity={rightPipetteEntity}
          timelineFrame={frame.robotState}
          analysis={analysis}
        />
      </Flex>
      <Flex
        ref={wrapperRef}
        alignSelf={ALIGN_STRETCH}
        overflowY={OVERFLOW_SCROLL}
        width="100%"
      >
        <ViewportList
          viewportRef={wrapperRef}
          ref={commandListRef}
          items={commands}
          axis="x"
        >
          {(command, index) => (
            <CommandItem
              index={index}
              command={command}
              currentCommandIndex={currentCommandIndex}
              setCurrentCommandIndex={setCurrentCommandIndex}
              analysis={analysis}
              robotType={robotType}
              allRunDefs={allRunDefs}
            />
          )}
        </ViewportList>
      </Flex>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <LegacyStyledText as="label" marginY={SPACING.spacing8}>
          Jump to command
        </LegacyStyledText>
        <PrimaryButton onClick={handlePlayPause} width="max-content">
          {isPlaying ? 'Pause' : 'Play'}
        </PrimaryButton>
      </Flex>
      <input
        type="range"
        min={1}
        max={commands.length}
        value={currentCommandIndex + 1}
        onChange={e => {
          const nextIndex = Number(e.target.value) - 1
          setCurrentCommandIndex(nextIndex)
          commandListRef.current?.scrollToIndex(nextIndex)
        }}
      />
      <Flex alignSelf={ALIGN_STRETCH} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <LegacyStyledText as="p">1</LegacyStyledText>
        <LegacyStyledText as="p">{commands.length}</LegacyStyledText>
      </Flex>
      {currentCommandIndex !== 0 &&
      currentCommandIndex !== commands.length - 1 ? (
        <LegacyStyledText
          as="p"
          marginLeft={(currentCommandIndex / (commands.length - 1)) * 886}
        >
          {currentCommandIndex + 1}
        </LegacyStyledText>
      ) : null}
    </Flex>
  )
}
