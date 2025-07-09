import { useEffect, useState } from 'react'

import { COLORS, Icon, StyledText } from '@opentrons/components'

import styles from './annotatedSteps.module.css'
import { IndividualCommand } from './IndividualCommand'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { LeafNode } from '/app/redux/protocol-storage'

interface AnnotatedGroupProps {
  annotationType: string
  subCommands: LeafNode[]
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  allRunDefs: LabwareDefinition[]
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
  } = props
  const [isExpanded, setIsExpanded] = useState(() =>
    subCommands.some(command => command.isHighlighted)
  )

  useEffect(() => {
    setIsExpanded(subCommands.some(command => command.isHighlighted))
  }, [subCommands])

  return (
    <div className={styles.annotated_group_container}>
      <div
        onClick={() => {
          setIsExpanded(!isExpanded)
          handlePause?.()
        }}
        className={styles.annotated_group_header}
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          {annotationType}
        </StyledText>
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size="2rem"
          color={COLORS.black90}
        />
      </div>

      {isExpanded ? (
        <div className={styles.annotated_group_expanded}>
          {subCommands.map((subCommand, index) => (
            <IndividualCommand
              fromGroup={false}
              key={`${subCommand.command.id}_${index}`}
              command={subCommand.command}
              analysis={analysis}
              isHighlighted={subCommand.isHighlighted}
              allRunDefs={allRunDefs}
              setSelectedCommand={setSelectedCommand}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
