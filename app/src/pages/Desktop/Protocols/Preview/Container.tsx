import { useEffect, useRef, useState } from 'react'
import { ViewportListRef } from 'react-viewport-list'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  constructInvariantContextFromRunCommands,
  getResultingTimelineFrameFromRunCommands,
} from '@opentrons/step-generation'

import { GroupedCommands } from '/app/redux/protocol-storage'

import { CommandSteps } from './CommandSteps'
import { Controls } from './Controls'
import { DeckView } from './DeckView'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const SEC_PER_FRAME = 3000

interface ContainerProps {
  analysis: ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
}
export function Container(props: ContainerProps): JSX.Element {
  const { analysis, groupedCommands } = props
  const { commands, robotType, liquids } = analysis

  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [currentCommandIndex, setCurrentCommandIndex] = useState<number>(0)
  const commandListRef = useRef<ViewportListRef>(null)

  const currentCommandsSlice = commands.slice(0, currentCommandIndex + 1)
  const invariantContextFromRunCommands = constructInvariantContextFromRunCommands(
    commands
  )
  const { frame, invariantContext } = getResultingTimelineFrameFromRunCommands(
    currentCommandsSlice,
    invariantContextFromRunCommands
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

  return (
    <>
      <Controls
        protocolName={analysis.metadata.protocolName}
        numErrors={analysis.errors.length}
        numCommandLength={commands.length}
        currentCommandIndex={currentCommandIndex}
        setCurrentCommandIndex={setCurrentCommandIndex}
        commandListRef={commandListRef}
        handlePlayPause={handlePlayPause}
      />
      <div style={{ display: 'flex' }}>
        <DeckView
          invariantContext={invariantContext}
          robotState={robotState}
          robotType={robotType ?? FLEX_ROBOT_TYPE}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
        />
        <CommandSteps
          analysis={analysis}
          currentCommandIndex={currentCommandIndex}
          groupedCommands={groupedCommands}
        />
      </div>
    </>
  )
}
