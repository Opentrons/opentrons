import { useMemo } from 'react'

import {
  COLORS,
  getLabwareDefinitionsFromCommands,
  Icon,
  StyledText,
} from '@opentrons/components'

import { AnnotatedGroup } from './AnnotatedGroup'
import styles from './annotatedSteps.module.css'
import { IndividualCommand } from './IndividualCommand'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

interface AnnotatedStepsProps {
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  groupedCommands: GroupedCommands | null
  currentCommandIndex?: number
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
  handlePause?: () => void
}

export function AnnotatedSteps(props: AnnotatedStepsProps): JSX.Element {
  const {
    analysis,
    currentCommandIndex,
    groupedCommands,
    setSelectedCommand,
    handlePause,
  } = props
  const isValidRobotSideAnalysis = analysis != null
  const allRunDefs = useMemo(
    () =>
      analysis != null
        ? getLabwareDefinitionsFromCommands(analysis.commands)
        : [],
    [isValidRobotSideAnalysis]
  )
  const annotations = analysis?.commandAnnotations ?? []

  const groupedCommandsHighlightedInfo = groupedCommands?.map(node => {
    if ('annotationIndex' in node) {
      return {
        ...node,
        isHighlighted: node.subCommands.some(subNode => subNode.isHighlighted),
        subCommands: node.subCommands.map(subNode => ({
          ...subNode,
          isHighlighted:
            currentCommandIndex === analysis.commands.indexOf(subNode.command),
        })),
      }
    } else {
      return {
        ...node,
        isHighlighted:
          currentCommandIndex === analysis.commands.indexOf(node.command),
      }
    }
  })
  return (
    <div className={styles.annotated_steps_container}>
      <div className={styles.annotated_steps_wrap}>
        {groupedCommandsHighlightedInfo != null &&
        groupedCommandsHighlightedInfo.length > 0
          ? groupedCommandsHighlightedInfo.map((group, index) =>
              'annotationIndex' in group ? (
                <AnnotatedGroup
                  key={`group_${group.annotationIndex}_${index}`}
                  analysis={analysis}
                  annotationType={
                    annotations[group.annotationIndex]?.machineReadableName
                  }
                  subCommands={group.subCommands}
                  allRunDefs={allRunDefs}
                  setSelectedCommand={setSelectedCommand}
                  handlePause={handlePause}
                />
              ) : (
                <IndividualCommand
                  fromGroup={true}
                  key={group.command.id}
                  command={group.command}
                  isHighlighted={group.isHighlighted}
                  analysis={analysis}
                  allRunDefs={allRunDefs}
                  setSelectedCommand={setSelectedCommand}
                />
              )
            )
          : analysis.commands.map((command, index) => (
              <IndividualCommand
                fromGroup={false}
                key={`individual_${command.id}`}
                command={command}
                isHighlighted={index === currentCommandIndex}
                analysis={analysis}
                allRunDefs={allRunDefs}
                setSelectedCommand={setSelectedCommand}
              />
            ))}
        {analysis?.errors.length > 0 ? (
          <div className={styles.annotated_steps_error_container}>
            {analysis?.errors.map(error => (
              <div
                className={styles.annotated_steps_error_header}
                key={error.id}
              >
                <Icon name="ot-alert" size="1rem" color={COLORS.red60} />
                <StyledText desktopStyle="bodyDefaultRegular">
                  {error.detail}
                </StyledText>
              </div>
            ))}
            <div className={styles.annotated_steps_final_command}>
              <StyledText desktopStyle="bodyDefaultRegular">
                Unable to show steps past errors
              </StyledText>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
