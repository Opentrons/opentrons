import { useEffect, useMemo, useRef, useState } from 'react'
import { ViewportListRef } from 'react-viewport-list'

import { getLabwareDefinitionsFromCommands } from '@opentrons/components'
import { FLEX_ROBOT_TYPE, RunTimeCommand } from '@opentrons/shared-data'
import {
  constructInvariantContextFromRunCommands,
  getResultingTimelineFrameFromRunCommands,
} from '@opentrons/step-generation'

import { GroupedCommands } from '/app/redux/protocol-storage'

import { CommandSteps } from './CommandSteps'
import { Controls } from './Controls'
import { DeckView } from './DeckView'
import { SlotDetails } from './SlotDetails'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const SEC_PER_FRAME = 1000

interface ContainerProps {
  analysis: ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
}
export function Container(props: ContainerProps): JSX.Element {
  const { analysis, groupedCommands } = props
  const { commands, robotType, liquids } = analysis

  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const commandListRef = useRef<ViewportListRef>(null)

  const [selectedCommandId, setSelectedCommand] = useState<string | null>(
    commands[0]?.id ?? null
  )

  const selectedCommandIndex = commands.findIndex(
    command => command.id === selectedCommandId
  )

  const currentCommandsSlice = commands.slice(0, selectedCommandIndex + 1)
  const invariantContextFromRunCommands = constructInvariantContextFromRunCommands(
    commands
  )
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

        commandListRef.current?.scrollToIndex(nextIndex)

        return nextId
      })
    }, SEC_PER_FRAME)

    return () => clearInterval(intervalId)
  }, [isPlaying, commands])

  const { robotState } = frame
  const selectedRunTimeCommand = commands.find(
    command => command.id === selectedCommandId
  )

  const allRunDefs = getLabwareDefinitionsFromCommands(commands)

  return (
    <>
      <Controls
        protocolName={analysis.metadata.protocolName}
        numErrors={analysis.errors.length}
        numCommandLength={commands.length}
        currentCommandIndex={selectedCommandIndex}
        setSelectedCommand={setSelectedCommand}
        commandListRef={commandListRef}
        handlePlayPause={handlePlayPause}
        isPlaying={isPlaying}
        commands={commands}
      />
      <div style={{ display: 'flex' }}>
        <DeckView
          invariantContext={invariantContext}
          robotState={robotState}
          robotType={robotType ?? FLEX_ROBOT_TYPE}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          selectedRunTimeCommand={selectedRunTimeCommand}
        />
        {selectedSlot != null && selectedRunTimeCommand != null ? (
          <SlotDetails
            slotId={selectedSlot}
            command={selectedRunTimeCommand}
            robotState={robotState}
            onClose={() => {
              setSelectedSlot(null)
            }}
            analysis={analysis}
            robotType={robotType ?? FLEX_ROBOT_TYPE}
            allRunDefs={allRunDefs}
            invariantContext={invariantContext}
            liquids={liquids}
          />
        ) : (
          <CommandSteps
            analysis={analysis}
            currentCommandIndex={selectedCommandIndex}
            groupedCommands={groupedCommands}
            setSelectedCommand={setSelectedCommand}
          />
        )}
      </div>
    </>
  )
}
