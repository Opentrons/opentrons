import { useEffect, useState } from 'react'

import { getLabwareDefinitionsFromCommands } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  constructInvariantContextFromRunCommands,
  getResultingTimelineFrameFromRunCommands,
} from '@opentrons/step-generation'

import { getProtocolDisplayName } from '/app/transformations/protocols'

import { CommandSteps } from './CommandSteps'
import { Controls } from './Controls'
import { DeckView } from './DeckView'
import styles from './preview.module.css'
import { SlotDetails } from './SlotDetails'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

const SEC_PER_FRAME = 1000

interface ContainerProps {
  analysis: ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
  protocolKey: string
  srcFileNames: string[]
}
export function PreviewContainer(props: ContainerProps): JSX.Element {
  const { analysis, groupedCommands, protocolKey, srcFileNames } = props
  const { commands, robotType, liquids } = analysis

  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

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

        return nextId
      })
    }, SEC_PER_FRAME)

    return () => {
      clearInterval(intervalId)
    }
  }, [isPlaying, commands])

  const { robotState } = frame
  const selectedRunTimeCommand = commands.find(
    command => command.id === selectedCommandId
  )
  const isThermocyclerAttached = Object.keys(robotState.modules).some(
    id => invariantContext.moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE
  )
  const allRunDefs = getLabwareDefinitionsFromCommands(commands)

  const protocolDisplayName = getProtocolDisplayName(
    protocolKey,
    srcFileNames,
    analysis
  )
  const commandLength = analysis.commands.length
  const percentComplete =
    selectedCommandIndex != null
      ? (selectedCommandIndex / commandLength) * 100
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
  return (
    <div className={styles.app}>
      <Controls
        protocolName={protocolDisplayName}
        numErrors={analysis.errors.length}
        numCommandLength={commands.length}
        currentCommandIndex={selectedCommandIndex}
        setSelectedCommand={setSelectedCommand}
        handlePlayPause={handlePlayPause}
        isPlaying={isPlaying}
        commands={commands}
        groupedCommands={groupedCommands}
      />
      <div className={styles.preview_container}>
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
            percentComplete={percentComplete}
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
            percentComplete={percentComplete}
            handlePause={() => {
              setIsPlaying(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
