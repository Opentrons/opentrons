import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import {
  FLEX_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  constructInvariantContextFromRunCommands,
  getResultingTimelineFrameFromRunCommands,
} from '@opentrons/step-generation'

import { Controls } from '/app/organisms/Desktop/ProtocolVisualization/Controls'
import { StepDetailContainer } from '/app/organisms/Desktop/ProtocolVisualization/StepDetailContainer'
import { stepDetailViewerOpenAction } from '/app/redux/shell'
import { getProtocolDisplayName } from '/app/transformations/protocols'

import { CommandSteps } from './CommandSteps'
import { DeckView } from './DeckView'
import styles from './visualizercontainer.module.css'

import type { MouseEvent } from 'react'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

const INITIAL_MILLI_SECONDS_PER_FRAME = 2000
const INITIAL_WIDTH_PX = 200
const MIN_CENTER_WIDTH_PX = 200
const MIN_COLUMN_WIDTH_PX = 100
const MAX_COLUMN_WIDTH_PX = 400
const CONTAINER_PADDING_PX = 32 // 16px * 2

type ResizableColumn = 'left' | 'right'

interface VisualizerContainerProps {
  analysis: ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
  protocolKey: string
  srcFileNames: string[]
}
export function VisualizerContainer(
  props: VisualizerContainerProps
): JSX.Element {
  const dispatch = useDispatch()
  const { analysis, groupedCommands, protocolKey, srcFileNames } = props
  const { commands, robotType, liquids } = analysis
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [milliSecondsPerFrame, setMilliSecondsPerFrame] = useState<number>(
    INITIAL_MILLI_SECONDS_PER_FRAME
  )

  const [selectedCommandId, setSelectedCommand] = useState<string | null>(
    commands[0]?.id ?? null
  )
  // for resizable columns
  const [leftWidth, setLeftWidth] = useState<number>(INITIAL_WIDTH_PX)
  const [rightWidth, setRightWidth] = useState<number>(INITIAL_WIDTH_PX)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef<ResizableColumn | null>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)
  const leftWidthRef = useRef<number>(leftWidth)
  const rightWidthRef = useRef<number>(rightWidth)
  useEffect(() => {
    leftWidthRef.current = leftWidth
  }, [leftWidth])

  useEffect(() => {
    rightWidthRef.current = rightWidth
  }, [rightWidth])

  // temporarily filter out loadCommands and home commands for the PV MVP
  const filteredCommands = commands.filter(
    command =>
      !command.commandType.includes('load') && command.commandType !== 'home'
  )

  const selectedCommandIndex = commands.findIndex(
    command => command.id === selectedCommandId
  )
  const filteredSelectedCommandIndex = filteredCommands.findIndex(
    command => command.id === selectedCommandId
  )

  const currentCommandsSlice = commands.slice(0, selectedCommandIndex + 1)
  const invariantContextFromRunCommands =
    constructInvariantContextFromRunCommands(commands)
  const { frame, invariantContext } = getResultingTimelineFrameFromRunCommands(
    currentCommandsSlice,
    invariantContextFromRunCommands
  )

  const handlePlayPause = (): void => {
    setIsPlaying(prev => !prev)
  }

  useEffect(() => {
    if (!isPlaying) return

    const intervalId = setInterval(() => {
      setSelectedCommand(prevId => {
        const currentIndex = commands.findIndex(cmd => cmd.id === prevId)
        const nextIndex =
          currentIndex < commands.length - 1 ? currentIndex + 1 : 0
        const nextId = commands[nextIndex]?.id ?? null

        return nextId
      })
    }, milliSecondsPerFrame)

    return () => {
      clearInterval(intervalId)
    }
  }, [isPlaying, commands, milliSecondsPerFrame])

  const { robotState } = frame
  const selectedRunTimeCommand = commands.find(
    command => command.id === selectedCommandId
  )
  const isThermocyclerAttached = Object.keys(robotState.modules).some(
    id => invariantContext.moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE
  )

  const protocolDisplayName = getProtocolDisplayName(
    protocolKey,
    srcFileNames,
    analysis
  )
  const percentComplete =
    filteredSelectedCommandIndex != null
      ? (filteredSelectedCommandIndex / filteredCommands.length) * 100
      : 0

  const thermocyclerSlots = ['A1', '8', '10', '11']

  useEffect(() => {
    if (
      isThermocyclerAttached &&
      selectedSlot != null &&
      thermocyclerSlots.includes(selectedSlot)
    ) {
      if (robotType === FLEX_ROBOT_TYPE) {
        setSelectedSlot('B1')
      } else {
        setSelectedSlot('7')
      }
    }
  }, [isThermocyclerAttached, selectedSlot])

  const handleMouseDown = (
    e: MouseEvent<HTMLDivElement>,
    column: ResizableColumn
  ): void => {
    e.preventDefault()
    resizingRef.current = column
    startXRef.current = e.clientX
    startWidthRef.current = column === 'left' ? leftWidth : rightWidth

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (resizingRef.current === null) return

    const containerWidth = containerRef.current?.clientWidth ?? 0
    if (containerWidth === 0) return

    const deltaX = e.clientX - startXRef.current

    if (resizingRef.current === 'left') {
      const newWidth = startWidthRef.current + deltaX
      // calculate the remaining width of the center column
      const centerWidth =
        containerWidth - newWidth - rightWidthRef.current - CONTAINER_PADDING_PX

      if (
        newWidth >= MIN_COLUMN_WIDTH_PX &&
        newWidth <= MAX_COLUMN_WIDTH_PX &&
        centerWidth >= MIN_CENTER_WIDTH_PX
      ) {
        setLeftWidth(newWidth)
      }
    } else if (resizingRef.current === 'right') {
      const newWidth = startWidthRef.current - deltaX
      const centerWidth =
        containerWidth - leftWidthRef.current - newWidth - CONTAINER_PADDING_PX

      if (
        newWidth >= MIN_COLUMN_WIDTH_PX &&
        newWidth <= MAX_COLUMN_WIDTH_PX &&
        centerWidth >= MIN_CENTER_WIDTH_PX
      ) {
        setRightWidth(newWidth)
      }
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleMouseMoveRef = useRef(handleMouseMove)
  const handleMouseUpRef = useRef(handleMouseUp)

  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove
    handleMouseUpRef.current = handleMouseUp
  }, [handleMouseMove, handleMouseUp])

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveRef.current)
      window.removeEventListener('mouseup', handleMouseUpRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className={styles.layout_container}>
      {/* Left Column is resizable */}
      <div className={styles.left_column} style={{ width: `${leftWidth}px` }}>
        <CommandSteps
          analysis={analysis}
          currentCommandIndex={filteredSelectedCommandIndex}
          groupedCommands={groupedCommands}
          setSelectedCommand={setSelectedCommand}
          percentComplete={percentComplete}
          handlePause={() => {
            setIsPlaying(false)
          }}
        />
        {/* Left column resizer */}
        <div
          className={`${styles.resizer} ${styles.resizer_right}`}
          onMouseDown={(e: MouseEvent<HTMLDivElement>) => {
            handleMouseDown(e, 'left')
          }}
        />
      </div>

      {/* Center Column is not resizable the width will be changed by the left and right column */}
      <div className={styles.center_column}>
        <Controls
          protocolName={protocolDisplayName}
          numErrors={analysis.errors.length}
          numCommandLength={filteredCommands.length}
          currentCommandIndex={filteredSelectedCommandIndex}
          setSelectedCommand={setSelectedCommand}
          handlePlayPause={handlePlayPause}
          isPlaying={isPlaying}
          commands={filteredCommands}
          groupedCommands={groupedCommands}
          spotlightWindowData={{
            protocolKey,
            slot: selectedSlot,
            command: selectedRunTimeCommand,
            robotState,
            invariantContext,
            analysis,
            liquids,
          }}
          milliSecondsPerFrame={milliSecondsPerFrame}
          setMilliSecondsPerFrame={setMilliSecondsPerFrame}
        />

        <DeckView
          commands={analysis.commands}
          liquids={liquids}
          invariantContext={invariantContext}
          robotState={robotState}
          robotType={robotType ?? FLEX_ROBOT_TYPE}
          selectedSlot={selectedSlot}
          setSelectedSlot={slot => {
            setSelectedSlot(slot)
            if (selectedRunTimeCommand != null && selectedSlot != null) {
              dispatch(
                stepDetailViewerOpenAction({
                  protocolKey,
                  slot: selectedSlot,
                  command: selectedRunTimeCommand,
                  robotState,
                  invariantContext,
                  analysis,
                  liquids,
                })
              )
            }
          }}
          selectedRunTimeCommand={selectedRunTimeCommand}
        />
      </div>
      {/* Right Column is resizable */}
      <div className={styles.right_column} style={{ width: `${rightWidth}px` }}>
        {/* Right column resizer */}
        <div
          className={`${styles.resizer} ${styles.resizer_left}`}
          onMouseDown={(e: MouseEvent<HTMLDivElement>) => {
            handleMouseDown(e, 'right')
          }}
        />
        {selectedRunTimeCommand != null ? (
          <StepDetailContainer
            protocolKey={protocolKey}
            commands={commands}
            robotState={robotState}
            invariantContext={invariantContext}
            currentCommand={selectedRunTimeCommand}
            liquids={liquids}
          />
        ) : null}
      </div>
    </div>
  )
}
