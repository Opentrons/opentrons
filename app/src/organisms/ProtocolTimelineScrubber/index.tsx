import * as React from 'react'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import ViewportList from 'react-viewport-list'
import {
  Flex,
  Box,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_CENTER,
  TEXT_TRANSFORM_UPPERCASE,
  ALIGN_FLEX_END,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_STRETCH,
  TYPOGRAPHY,
  LegacyStyledText,
  BaseDeck,
  PrimaryButton,
} from '@opentrons/components'
import { getResultingTimelineFrameFromRunCommands } from '@opentrons/step-generation'
import {
  FLEX_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  getSimplestDeckConfigForProtocol,
} from '@opentrons/shared-data'
import { getCommandTextData } from '../../molecules/Command/utils/getCommandTextData'
import { CommandText } from '../../molecules/Command'
import {
  getAllWellContentsForActiveItem,
  wellFillFromWellContents,
} from './utils'

import type {
  CompletedProtocolAnalysis,
  LabwareLocation,
  ProtocolAnalysisOutput,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  LocationLiquidState,
  ModuleTemporalProperties,
  PipetteEntity,
  TimelineFrame,
} from '@opentrons/step-generation'
import type { ViewportListRef } from 'react-viewport-list'
import type { LabwareOnDeck, Module } from '@opentrons/components'

const COMMAND_WIDTH_PX = 240

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
export const VIEWBOX_WIDTH = 300
export const VIEWBOX_HEIGHT = 230

export function ProtocolTimelineScrubber(
  props: ProtocolTimelineScrubberProps
): JSX.Element {
  const { commands, analysis, robotType = FLEX_ROBOT_TYPE } = props
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const commandListRef = React.useRef<ViewportListRef>(null)
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )
  const [isPlaying, setIsPlaying] = React.useState<boolean>(true)

  const currentCommandsSlice = commands.slice(0, currentCommandIndex + 1)
  const { frame, invariantContext } = getResultingTimelineFrameFromRunCommands(
    currentCommandsSlice
  )
  const handlePlayPause = (): void => {
    setIsPlaying(!isPlaying)
  }

  React.useEffect(() => {
    if (isPlaying) {
      const intervalId = setInterval(() => {
        setCurrentCommandIndex(prev => {
          const nextIndex = prev < commands.length - 1 ? prev + 1 : 0
          commandListRef.current?.scrollToIndex(nextIndex)
          return nextIndex
        })
      }, 1000)

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
    liquid => liquid.displayColor ?? 'blue'
  )

  return (
    <Flex
      height="95vh"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
    >
      <Flex gridGap={SPACING.spacing8} flex="1 1 0">
        <Flex flex="1 1 0" width="300px" height="70vh">
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
              ): React.ComponentProps<typeof Module>['innerProps'] => {
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
        overflowY="scroll"
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
interface PipetteMountVizProps {
  pipetteId: string | null
  pipetteEntity: PipetteEntity | null
  mount: string
  timelineFrame: TimelineFrame
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
}
function PipetteMountViz(props: PipetteMountVizProps): JSX.Element | null {
  const { mount, pipetteEntity, pipetteId, timelineFrame, analysis } = props
  const [showPipetteDetails, setShowPipetteDetails] = React.useState(false)

  return pipetteEntity == null ? null : (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      maxWidth="4rem"
    >
      <LegacyStyledText
        as="h1"
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        cursor="pointer"
        onClick={() => {
          setShowPipetteDetails(!showPipetteDetails)
        }}
      >
        {mount}
      </LegacyStyledText>
      {showPipetteDetails ? (
        <LegacyStyledText
          as="p"
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginY={SPACING.spacing8}
        >
          {pipetteEntity?.spec?.displayName ?? 'none'}
        </LegacyStyledText>
      ) : null}
      {pipetteEntity != null && pipetteId != null ? (
        <PipetteSideView
          allNozzlesHaveTips={timelineFrame.tipState.pipettes[pipetteId]}
          allNozzleTipContents={Object.values(
            timelineFrame.liquidState.pipettes[pipetteId]
          )}
          maxVolume={
            pipetteEntity != null
              ? pipetteEntity.spec.liquids.default.maxVolume
              : 0
          }
          analysis={analysis}
        />
      ) : (
        <Box size="4rem" />
      )}
    </Flex>
  )
}

interface SideViewProps {
  allNozzleTipContents: LocationLiquidState[]
  maxVolume: number
  allNozzlesHaveTips: boolean
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
}
function PipetteSideView({
  allNozzleTipContents,
  maxVolume,
  allNozzlesHaveTips,
  analysis,
}: SideViewProps): JSX.Element {
  const channelCount = Math.min(Object.keys(allNozzleTipContents).length, 8)

  return (
    <svg width="4rem" height="16rem" viewBox="0 0 100 200">
      {channelCount <= 1 ? (
        <>
          <rect x="30" y="0" height="80" width="40" stroke="#000" />
          <rect x="45" y="80" height="50" width="10" stroke="#000" />
          {allNozzlesHaveTips ? (
            <TipSideView
              x={45}
              y={130}
              tipContents={allNozzleTipContents[0]}
              maxVolume={maxVolume}
              analysis={analysis}
            />
          ) : (
            <path
              d="M47,130 L49,140 H51 L53,130 H47z"
              stroke="#000"
              fill="#000"
            />
          )}
        </>
      ) : (
        <>
          <rect x="30" y="0" height="40" width="40" stroke="#000" />
          <path d="M30,40 L10,85 H90 L70,40 H30z" stroke="#000" />
          <rect x="10" y="85" height="45" width="80" stroke="#000" />
          {Object.values(allNozzleTipContents)
            .slice(0, 8)
            .map((tipContents, index) => {
              const x = index * 10 + 10
              return allNozzlesHaveTips ? (
                <TipSideView
                  x={x}
                  y={130}
                  key={index}
                  tipContents={tipContents}
                  maxVolume={maxVolume}
                  analysis={analysis}
                />
              ) : (
                <path
                  d={`M${x + 2},130 L${x + 4},140 H${x + 6} L${x + 8},130 H${
                    x + 2
                  }z`}
                  stroke="#000"
                  fill="#000"
                />
              )
            })}
        </>
      )}
    </svg>
  )
}

interface TipSideViewProps {
  tipContents: LocationLiquidState
  maxVolume: number
  x: number
  y: number
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
}
function TipSideView({
  tipContents,
  maxVolume,
  x,
  y,
  analysis,
}: TipSideViewProps): JSX.Element {
  const emptyVolumeLeft =
    maxVolume -
    Object.entries(tipContents).reduce((acc, [liquidId, { volume }]) => {
      if (liquidId === '__air__') return acc
      return acc + volume
    }, 0)
  const yOfFirstLiquid = (emptyVolumeLeft / maxVolume) * 50

  return (
    <>
      <rect x={x} y={y} height={yOfFirstLiquid} width="10" fill="#FFF" />
      {Object.entries(tipContents).map(([liquidId, { volume }]) => {
        if (liquidId === '__air__') return null
        const displayColor = analysis.liquids.find(l => l.id === liquidId)
          ?.displayColor
        return (
          <rect
            key={liquidId}
            x={x}
            y={y + yOfFirstLiquid}
            height={(volume / maxVolume) * 50}
            width="10"
            fill={displayColor ?? 'rebeccapurple'}
          />
        )
      })}
      <path
        d={`M${x},130 V150 L${x + 2},170 L${x + 4},180 H${x + 6} L${
          x + 8
        },170 L${x + 10},150 V130 H${x}z`}
        stroke="#000"
        fill="none"
      />
      <path
        d={`M${x - 1},129 V150 L${x + 2},170 L${x + 4},180 H${x + 6} L${
          x + 8
        },170 L${x + 10},150 V130 H${x + 11} V181 H${x - 1} V129z`}
        fill="#FFF"
        stroke="none"
      />
    </>
  )
}

interface CommandItemProps {
  command: RunTimeCommand
  index: number
  currentCommandIndex: number
  setCurrentCommandIndex: (index: number) => void
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  robotType: RobotType
}
function CommandItem(props: CommandItemProps): JSX.Element {
  const [showDetails, setShowDetails] = React.useState(false)
  const {
    index,
    command,
    currentCommandIndex,
    setCurrentCommandIndex,
    analysis,
    robotType,
  } = props
  const params: RunTimeCommand['params'] = command.params ?? {}
  return (
    <Flex
      key={index}
      backgroundColor={
        index === currentCommandIndex
          ? COLORS.blue35
          : index < currentCommandIndex
          ? '#00002222'
          : '#fff'
      }
      border={
        index === currentCommandIndex
          ? `1px solid ${COLORS.blue35}`
          : '1px solid #000'
      }
      padding={SPACING.spacing4}
      flexDirection={DIRECTION_COLUMN}
      minWidth={`${COMMAND_WIDTH_PX}px`}
      width={`${COMMAND_WIDTH_PX}px`}
      height="6rem"
      overflowX="hidden"
      overflowY="scroll"
      cursor="pointer"
      onClick={() => {
        setCurrentCommandIndex(index)
      }}
    >
      <LegacyStyledText
        onClick={() => {
          setShowDetails(!showDetails)
        }}
        as="p"
        alignSelf={ALIGN_FLEX_END}
      >
        {index + 1}
      </LegacyStyledText>
      <CommandText
        command={command}
        commandTextData={getCommandTextData(analysis)}
        robotType={robotType}
      />
      {showDetails
        ? Object.entries(params).map(([key, value]) => (
            <Flex
              key={key}
              flexDirection={DIRECTION_COLUMN}
              marginBottom={SPACING.spacing2}
              paddingLeft={SPACING.spacing2}
            >
              <LegacyStyledText as="label" marginRight={SPACING.spacing2}>
                {key}:
              </LegacyStyledText>
              {value != null && typeof value === 'object' ? (
                /*  eslint-disable @typescript-eslint/no-unsafe-argument */
                Object.entries(value).map(([innerKey, innerValue]) => (
                  <Flex key={innerKey}>
                    <LegacyStyledText as="label" marginRight={SPACING.spacing2}>
                      {key}:
                    </LegacyStyledText>
                    <LegacyStyledText as="p" title={String(innerValue)}>
                      {String(innerValue)}
                    </LegacyStyledText>
                  </Flex>
                ))
              ) : (
                <LegacyStyledText as="p" title={String(value)}>
                  {String(value)}
                </LegacyStyledText>
              )}
            </Flex>
          ))
        : null}
    </Flex>
  )
}
