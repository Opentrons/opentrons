import * as React from 'react'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import isEmpty from 'lodash/isEmpty'
import { FixedSizeList } from 'react-window'

import {
  RobotWorkSpace,
  Module,
  LabwareRender,
  Flex,
  Box,
  Text,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_CENTER,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_BOLD,
  ALIGN_FLEX_END,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_STRETCH,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'
import { getResultingTimelineFrameFromRunCommands } from '@opentrons/step-generation'
import {
  inferModuleOrientationFromXCoordinate,
  getModuleDef2,
} from '@opentrons/shared-data'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type {
  InvariantContext,
  LocationLiquidState,
  PipetteEntity,
  TimelineFrame,
} from '@opentrons/step-generation'
import { StyledText } from '../../atoms/text'

const COMMAND_WIDTH_PX = 160

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
export const VIEWBOX_HEIGHT = 460

export function ProtocolTimelineScrubber(
  props: ProtocolTimelineScrubberProps
): JSX.Element {
  const deckDef = React.useMemo(() => getDeckDefinitions().ot2_standard, [])
  const { commands } = props
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const commandListRef = React.useRef<HTMLDivElement>(null)
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )

  const { frame, invariantContext } = getResultingTimelineFrameFromRunCommands(
    commands.slice(0, currentCommandIndex + 1)
  )
  const { robotState, command } = frame

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

  return (
    <Flex ref={wrapperRef} width="100%" flexDirection={DIRECTION_COLUMN}>
      <Flex>
        <Flex size="25rem" marginRight={SPACING.spacing3}>
          <RobotWorkSpace
            deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
            deckDef={deckDef}
            viewBox={`${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          >
            {({ deckSlotsById }) => (
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
                            invariantContext.labwareEntities[labwareInModuleId]
                              .def
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
                  const definition =
                    invariantContext.labwareEntities[labwareId].def

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
                      <LabwareRender
                        definition={definition}
                        wellFill={wellFill}
                        missingTips={missingTips}
                      />
                    </g>
                  )
                })}
              </>
            )}
          </RobotWorkSpace>
        </Flex>
        <PipetteMountViz
          mount="left"
          pipetteId={leftPipetteId}
          pipetteEntity={leftPipetteEntity}
          timelineFrame={frame}
          invariantContext={invariantContext}
        />
        <PipetteMountViz
          mount="right"
          pipetteId={rightPipetteId}
          pipetteEntity={rightPipetteEntity}
          timelineFrame={frame}
          invariantContext={invariantContext}
        />
      </Flex>
      <FixedSizeList
        ref={commandListRef}
        height={160}
        itemCount={commands.length}
        itemSize={COMMAND_WIDTH_PX}
        layout="horizontal"
        width={1000}
      >
        {({ index, style }) => (
          <div style={style}>
            <CommandItem
              index={index}
              command={commands[index]}
              currentCommandIndex={currentCommandIndex}
              setCurrentCommandIndex={setCurrentCommandIndex}
            />
          </div>
        )}
      </FixedSizeList>
      <StyledText as="label" marginY={SPACING.spacing2}>
        Jump to command
      </StyledText>
      <input
        type="range"
        min={1}
        max={commands.length}
        value={currentCommandIndex + 1}
        onChange={e => {
          const nextIndex = Number(e.target.value) - 1
          setCurrentCommandIndex(nextIndex)
          const progressOffset = window.innerWidth / 2
          commandListRef.current?.scrollToItem(nextIndex, 'center')
        }}
      />
      <Flex alignSelf={ALIGN_STRETCH} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Text as="p" fontSize="0.5rem">
          1
        </Text>
        <Text as="p" fontSize="0.5rem">
          {commands.length}
        </Text>
      </Flex>
      {currentCommandIndex !== 0 &&
      currentCommandIndex !== commands.length - 1 ? (
        <Text
          as="p"
          fontSize="0.5rem"
          marginLeft={
            (currentCommandIndex / (commands.length - 1)) *
            (wrapperRef.current?.getBoundingClientRect()?.width - 6 ?? 0)
          }
        >
          {currentCommandIndex + 1}
        </Text>
      ) : null}
    </Flex>
  )
}
interface PipetteMountVizProps {
  pipetteId: string | null
  pipetteEntity: PipetteEntity | null
  mount: string
  timelineFrame: TimelineFrame
  invariantContext: InvariantContext
}
function PipetteMountViz(props: PipetteMountVizProps): JSX.Element | null {
  const {
    mount,
    pipetteEntity,
    pipetteId,
    timelineFrame,
    invariantContext,
  } = props
  const { robotState } = timelineFrame

  const maxVolume = (Object.entries(
    invariantContext.pipetteEntities[pipetteId]?.tiprackLabwareDef?.wells ?? {}
  ).find(([_wellName, { totalLiquidVolume }]) => totalLiquidVolume != null) ?? [
    null,
    { totalLiquidVolume: 0 },
  ])[1].totalLiquidVolume


  return (
    <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_COLUMN}>
      <StyledText as="h1" textTransform={TEXT_TRANSFORM_UPPERCASE}>
        {mount}
      </StyledText>
      <StyledText as="p" fontSize="0.5rem" marginY={SPACING.spacing2}>
        {pipetteEntity?.spec?.displayName ?? 'none'}
      </StyledText>
      {pipetteEntity != null && pipetteId != null ? (
        <PipetteSideView
          allNozzlesHaveTips={robotState.tipState.pipettes[pipetteId]}
          allNozzleTipContents={robotState.liquidState.pipettes[pipetteId]}
          liquidEntities={invariantContext.liquidEntities}
          maxVolume={maxVolume}
        />
      ) : (
        <Box size="8rem" />
      )}
    </Flex>
  )
}

interface SideViewProps {
  allNozzleTipContents: LocationLiquidState[]
  liquidEntities: InvariantContext['liquidEntities']
  maxVolume: number
  allNozzlesHaveTips: boolean
}
function PipetteSideView({
  allNozzleTipContents,
  liquidEntities,
  maxVolume,
  allNozzlesHaveTips,
}: SideViewProps): JSX.Element {
  const channelCount = Object.keys(allNozzleTipContents).length
  return (
    <svg width="8rem" height="16rem" viewBox="0 0 100 200">
      {channelCount <= 1 ? (
        <>
          <rect x="30" y="0" height="80" width="40" stroke="#000" />
          <rect x="45" y="80" height="50" width="10" stroke="#000" />
          {allNozzlesHaveTips ? (
            <TipSideView
              x={45}
              y={130}
              tipContents={allNozzleTipContents[0]}
              liquidEntities={liquidEntities}
              maxVolume={maxVolume}
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
          {Object.values(allNozzleTipContents).map((tipContents, index) => {
            const x = index * 10 + 10
            return allNozzlesHaveTips ? (
              <TipSideView
                x={x}
                y={130}
                key={index}
                tipContents={tipContents}
                liquidEntities={liquidEntities}
                maxVolume={maxVolume}
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
  liquidEntities: InvariantContext['liquidEntities']
  maxVolume: number
  x: number
  y: number
}
function TipSideView({
  tipContents,
  liquidEntities,
  maxVolume,
  x,
  y,
}: TipSideViewProps): JSX.Element {
  const emptyVolumeLeft =
    maxVolume -
    Object.entries(tipContents).reduce((acc, [liquidId, { volume }]) => {
      if (liquidId === '__air__') return acc
      return acc + volume
    }, 0)
  const yOfFirstLiquid = (emptyVolumeLeft / maxVolume) * 50

  console.log('emptyVolumeLeft', emptyVolumeLeft)
  console.log('yOfFirstLiquid', yOfFirstLiquid)
  return (
    <>
      <rect x={x} y={y} height={yOfFirstLiquid} width="10" fill="#FFF" />
      {Object.entries(tipContents).map(([liquidId, { volume }]) => {
        if (liquidId === '__air__') return null
        return (
          <rect
            key={liquidId}
            x={x}
            y={y + yOfFirstLiquid}
            height={(volume / maxVolume) * 50}
            width="10"
            fill={liquidEntities[liquidId]?.displayColor ?? 'rebeccapurple'}
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
  setCurrentCommandIndex: (number) => void
}
function CommandItem(props: CommandItemProps): JSX.Element {
  const { index, command, currentCommandIndex, setCurrentCommandIndex } = props
  return (
    <Flex
      key={index}
      backgroundColor={
        index === currentCommandIndex
          ? COLORS.blueFocus
          : index < currentCommandIndex
          ? '#00002222'
          : '#fff'
      }
      border={
        index === currentCommandIndex
          ? `3px solid ${COLORS.blue}`
          : '1px solid #000'
      }
      padding={SPACING.spacing1}
      flexDirection={DIRECTION_COLUMN}
      minWidth={`${COMMAND_WIDTH_PX}px`}
      width={`${COMMAND_WIDTH_PX}px`}
      height="10rem"
      overflowX="hidden"
      overflowY="scroll"
      cursor="pointer"
      onClick={() => setCurrentCommandIndex(index)}
    >
      <Text as="p" fontSize="0.5rem" alignSelf={ALIGN_FLEX_END}>
        {index + 1}
      </Text>
      <StyledText
        as="p"
        fontSize="0.6rem"
        marginBottom={SPACING.spacing2}
        fontWeight={FONT_WEIGHT_BOLD}
      >
        {command.commandType}
      </StyledText>
      {Object.entries(command.params ?? {}).map(([key, value]) => (
        <Flex
          key={key}
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING.spacing1}
          paddingLeft={SPACING.spacing1}
        >
          <Text as="label" fontSize="0.6rem" marginRight={SPACING.spacing1}>
            {key}:
          </Text>
          {value != null && typeof value === 'object' ? (
            Object.entries(value).map(([innerKey, innerValue]) => (
              <Flex key={innerKey}>
                <Text
                  as="label"
                  fontSize="0.6rem"
                  marginRight={SPACING.spacing1}
                >
                  {key}:
                </Text>
                <Text as="p" fontSize="0.6rem" title={String(innerValue)}>
                  {String(innerValue)}
                </Text>
              </Flex>
            ))
          ) : (
            <Text as="p" fontSize="0.6rem" title={String(value)}>
              {String(value)}
            </Text>
          )}
        </Flex>
      ))}
    </Flex>
  )
}
