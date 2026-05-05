import { useEffect, useState } from 'react'

import { COLORS, StepGroup } from '@opentrons/components'

import styles from './annotatedsteps.module.css'
import { IndividualCommand } from './IndividualCommand'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { LeafNode } from '../../types'

interface AnnotatedGroupProps {
  scrollTargetId: string | null
  listElement: HTMLElement | null
  annotationType: string
  subCommands: LeafNode[]
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  allRunDefs: LabwareDefinition[]
  commandStartNumber: number
  annotationDescription: string
  setSelectedCommand?: Dispatch<SetStateAction<string | null>> // remove redux dependency
  handlePause?: () => void
  headerLeading?: ReactNode
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
    headerLeading,
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

  const isAnyStepHighlighted = subCommands.some(
    command => command.isHighlighted
  )

  return (
    <div className={styles.annotated_group_container}>
      <StepGroup
        title={annotationType}
        isExpand={isExpanded}
        handleClick={handleClick}
        isActive={isAnyStepHighlighted}
        subtitle={annotationDescription}
        headerLeading={headerLeading}
        titleColor={isAnyStepHighlighted ? COLORS.purple50 : undefined}
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
