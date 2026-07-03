import { useCallback, useEffect, useRef, useState } from 'react'

import { Modal } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  constructInvariantContextFromAnalysis,
  getResultingTimelineFrameFromRunCommands,
} from '@opentrons/step-generation'

import { CommandSteps } from '../CommandSteps'
import { Controls } from '../Controls'
import { DeckView } from '../DeckView'
import { SlotDetails } from '../SlotDetails'
import { StepDetailContainer } from '../StepDetailContainer'
import styles from './visualizercontainer.module.css'

import type { MouseEvent } from 'react'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { GroupedCommands } from '../../types'

const INITIAL_MILLISECONDS_PER_FRAME = 1000
const INITIAL_WIDTH_PX = 230
const MIN_CENTER_WIDTH_PX = 148
const MIN_LEFT_COLUMN_WIDTH_PX = 148
const MIN_RIGHT_COLUMN_WIDTH_PX = 172
const MAX_COLUMN_WIDTH_PX = 600
const GUTTER_WIDTH_PX = 16 // left and right gutters

type ResizableColumn = 'left' | 'right'

interface ProtocolVisualizationProps {
  analysis: ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
  protocolDisplayName?: string
}

export function ProtocolVisualization(
  props: ProtocolVisualizationProps
): JSX.Element {
  const groupedCommands = props.groupedCommands
  const analysis = props.analysis
  const createdDate = new Date(analysis.createdAt)
  const { commands, robotType, liquids } = analysis
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [milliSecondsPerFrame, setMilliSecondsPerFrame] = useState<number>(
    INITIAL_MILLISECONDS_PER_FRAME
  )
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const [selectedCommandId, setSelectedCommand] = useState<string | null>(null)

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
  const invariantContextFromAnalysis = constructInvariantContextFromAnalysis(
    analysis,
    analysis.config,
    createdDate
  )
  const { frame, invariantContext } = getResultingTimelineFrameFromRunCommands(
    currentCommandsSlice,
    invariantContextFromAnalysis
  )
  const handlePlayPause = (): void => {
    setIsPlaying(prev => !prev)
  }

  const { robotState } = frame
  const selectedRunTimeCommand = commands.find(
    command => command.id === selectedCommandId
  )

  useEffect(() => {
    if (selectedCommandId != null) return
    const initialId = filteredCommands[0]?.id ?? commands[0]?.id ?? null
    setSelectedCommand(initialId)
  }, [selectedCommandId, filteredCommands, commands])

  useEffect(() => {
    if (!isPlaying) return
    if (filteredCommands.length === 0) return

    const intervalId = setInterval(() => {
      setSelectedCommand(prevId => {
        const currentIndex = filteredCommands.findIndex(
          cmd => cmd.id === prevId
        )
        const nextIndex =
          currentIndex >= 0 && currentIndex < filteredCommands.length - 1
            ? currentIndex + 1
            : 0
        const nextId = filteredCommands[nextIndex]?.id ?? null

        return nextId
      })
    }, milliSecondsPerFrame)

    return () => {
      clearInterval(intervalId)
    }
  }, [isPlaying, filteredCommands, milliSecondsPerFrame])

  //  update the data for the spotlight window
  //  whenever the command index changes
  useEffect(
    () => {
      // if (selectedCommandId == null) return
      //
      // const nextIndex = commands.findIndex(c => c.id === selectedCommandId)
      // if (nextIndex < 0) return
      // const nextSpotlight = {
      //   slot: selectedSlot,
      //   command: commands[nextIndex],
      //   robotState,
      //   invariantContext,
      //   analysis,
      //   liquids,
      // }
      // if (nextSpotlight.slot != null && nextSpotlight.command != null) {
      //   setShowModal(null)
      //   // dispatch(stepDetailViewerUpdateAction(nextSpotlight))
      // }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.

    [
      selectedCommandId,
      selectedSlot,
      robotState,
      invariantContext,
      analysis,
      liquids,
      commands,
    ]
  )

  const isThermocyclerAttached = Object.keys(robotState.modules).some(
    id => invariantContext.moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE
  )

  const protocolDisplayName =
    props.protocolDisplayName ??
    analysis.metadata?.protocolName ??
    'Untitled Protocol'
  const clamp = (n: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, n))
  let percentComplete = 0

  if (filteredSelectedCommandIndex == null) {
    percentComplete = 0
  } else if (filteredCommands.length <= 1) {
    percentComplete = 100
  } else {
    percentComplete = clamp(
      (filteredSelectedCommandIndex / (filteredCommands.length - 1)) * 100,
      0,
      100
    )
  }

  const thermocyclerSlots = ['A1', '8', '10', '11']

  useEffect(
    () => {
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
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isThermocyclerAttached, selectedSlot]
  )

  const handleMouseDown = (
    e: MouseEvent<HTMLDivElement>,
    column: ResizableColumn
  ): void => {
    e.preventDefault()
    setIsDragging(true)
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
        containerWidth - newWidth - rightWidthRef.current - 2 * GUTTER_WIDTH_PX

      if (
        newWidth >= MIN_LEFT_COLUMN_WIDTH_PX &&
        newWidth <= MAX_COLUMN_WIDTH_PX &&
        centerWidth >= MIN_CENTER_WIDTH_PX
      ) {
        setLeftWidth(newWidth)
      }
    } else if (resizingRef.current === 'right') {
      const newWidth = startWidthRef.current - deltaX
      const centerWidth =
        containerWidth - leftWidthRef.current - newWidth - 2 * GUTTER_WIDTH_PX

      if (
        newWidth >= MIN_RIGHT_COLUMN_WIDTH_PX &&
        newWidth <= MAX_COLUMN_WIDTH_PX &&
        centerWidth >= MIN_CENTER_WIDTH_PX
      ) {
        setRightWidth(newWidth)
      }
    }
  }, [])

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false)
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
  const [showModal, setShowModal] = useState<boolean>(false)
  useEffect(() => {
    if (selectedSlot != null) {
      setShowModal(true)
    }
  }, [selectedSlot])
  // useEffect(() => {
  //   return () => {
  //     dispatch(stepDetailViewerCloseAction({ protocolKey }))
  //   }
  // }, [dispatch, protocolKey])

  return (
    <>
      {showModal ? (
        <Modal
          type="info"
          title={'slot details'}
          onClose={() => {
            setShowModal(false)
          }}
        >
          <SlotDetails
            slotId={selectedSlot ?? ''}
            robotState={robotState}
            invariantContext={invariantContext}
            analysis={analysis}
            liquids={liquids}
          />
        </Modal>
      ) : null}
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
            milliSecondsPerFrame={milliSecondsPerFrame}
            isGlobalPlaying={isPlaying}
          />
        </div>
        {/* Gutter between left & center */}
        <div
          className={`${styles.gutter} ${isDragging ? styles.grabbing : ''}`}
          onMouseDown={(e: MouseEvent<HTMLDivElement>) => {
            handleMouseDown(e, 'left')
          }}
        />
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
            milliSecondsPerFrame={milliSecondsPerFrame}
            setMilliSecondsPerFrame={setMilliSecondsPerFrame}
          />
          <DeckView
            filteredCommands={filteredCommands}
            commands={analysis.commands}
            liquids={liquids}
            invariantContext={invariantContext}
            robotState={robotState}
            robotType={robotType ?? FLEX_ROBOT_TYPE}
            setSelectedSlot={slot => {
              setSelectedSlot(slot)
            }}
            selectedRunTimeCommand={selectedRunTimeCommand}
          />
        </div>
        {/* Gutter between center & right */}
        <div
          className={`${styles.gutter} ${isDragging ? styles.grabbing : ''}`}
          onMouseDown={(e: MouseEvent<HTMLDivElement>) => {
            handleMouseDown(e, 'right')
          }}
        />
        {/* Right Column is resizable */}
        <div
          className={styles.right_column}
          style={{ width: `${rightWidth}px` }}
        >
          {selectedRunTimeCommand != null ? (
            <StepDetailContainer
              commands={commands}
              robotState={robotState}
              invariantContext={invariantContext}
              currentCommand={selectedRunTimeCommand}
              liquids={liquids}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
