import { useEffect, useState } from 'react'

import { StepGroup } from '@opentrons/components'

import styles from './annotatedsteps.module.css'
import { IndividualCommand } from './IndividualCommand'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { LeafNode } from '/app/redux/protocol-storage'

interface AnnotatedGroupProps {
  scrollTargetId: string | null
  listElement: HTMLElement | null
  annotationType: string
  subCommands: LeafNode[]
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  allRunDefs: LabwareDefinition[]
  commandStartNumber: number
  annotationDescription: string
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
  handlePause?: () => void
}
export function AnnotatedGroup(props: AnnotatedGroupProps): JSX.Element {
  const {
    subCommands,
    annotationType,
    analysis,
    allRunDefs,
    setSelectedCommand,
    handlePause,
    commandStartNumber,
    scrollTargetId,
    listElement,
    annotationDescription,
  } = props
  const [isExpanded, setIsExpanded] = useState(() =>
    subCommands.some(command => command.isHighlighted)
  )
  useEffect(() => {
    setIsExpanded(subCommands.some(command => command.isHighlighted))
  }, [subCommands])

  const handleClick = (): void => {
    setIsExpanded(!isExpanded)
    handlePause?.()
  }

  return (
    <div className={styles.annotated_group_container}>
      <StepGroup
        title={annotationType}
        isExpand={isExpanded}
        handleClick={handleClick}
        isActive={subCommands.some(command => command.isHighlighted)}
        subtitle={annotationDescription}
      >
        {isExpanded ? (
          <div className={styles.annotated_group_expanded}>
            {subCommands.map((subCommand, index) => (
              <IndividualCommand
                scrollTargetId={scrollTargetId}
                listElement={listElement}
                fromGroup={true}
                key={`${subCommand.command.id}_${index}`}
                command={subCommand.command}
                commandNumber={commandStartNumber + index}
                analysis={analysis}
                isHighlighted={subCommand.isHighlighted}
                allRunDefs={allRunDefs}
                setSelectedCommand={setSelectedCommand}
              />
            ))}
          </div>
        ) : null}
      </StepGroup>
    </div>
  )
}
