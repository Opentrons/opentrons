import { useLayoutEffect, useState } from 'react'

import { COLORS, Icon, StepGroup } from '@opentrons/components'

import styles from './annotatedsteps.module.css'
import { IndividualCommand } from './IndividualCommand'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { LeafNode } from '/app/redux/protocol-storage'

/** Reserve space for StepGroup header (title row, optional subtitle, padding). */
const STEP_GROUP_HEADER_RESERVE_PX = 80
const MIN_EXPANDED_BODY_PX = 160
const LIST_VIEWPORT_BOTTOM_BUFFER_PX = 8

interface AnnotatedGroupProps {
  scrollTargetId: string | null
  listElement: HTMLElement | null
  /** pixel height of the annotated steps list viewport (used to cap expanded body height). */
  listViewportHeight: number
  annotationType: string
  subCommands: LeafNode[]
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  allRunDefs: LabwareDefinition[]
  commandStartNumber: number
  annotationDescription: string
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
  handlePause?: () => void
  headerLeading?: ReactNode | null
  // rendered after sub-commands when analysis failed inside this annotation group
  trailingErrorsFooter?: ReactNode | null
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
    listViewportHeight,
    annotationDescription,
    headerLeading,
    trailingErrorsFooter,
  } = props
  const hasTrailingErrors = trailingErrorsFooter != null

  // Inactive groups start collapsed; open before paint if this group is active or has errors.
  const [isExpanded, setIsExpanded] = useState(false)
  useLayoutEffect(() => {
    setIsExpanded(
      subCommands.some(command => command.isHighlighted) || hasTrailingErrors
    )
  }, [subCommands, hasTrailingErrors])

  const handleClick = (): void => {
    setIsExpanded(!isExpanded)
    handlePause?.()
  }

  const isAnyStepHighlighted = subCommands.some(
    command => command.isHighlighted
  )

  const expandedMaxHeightPx =
    listViewportHeight > 0
      ? Math.max(
          MIN_EXPANDED_BODY_PX,
          listViewportHeight -
            STEP_GROUP_HEADER_RESERVE_PX -
            LIST_VIEWPORT_BOTTOM_BUFFER_PX
        )
      : null

  return (
    <div className={styles.annotated_group_container}>
      <StepGroup
        title={annotationType}
        isExpand={isExpanded}
        handleClick={handleClick}
        isActive={isAnyStepHighlighted}
        subtitle={annotationDescription}
        headerPrefixIcon={
          hasTrailingErrors ? (
            <Icon
              name="ot-alert"
              size="1rem"
              color={isAnyStepHighlighted ? COLORS.purple50 : COLORS.red60}
            />
          ) : null
        }
        headerLeading={headerLeading}
        {...(isAnyStepHighlighted ? { titleColor: COLORS.purple50 } : {})}
      >
        {isExpanded ? (
          <div
            className={styles.annotated_group_expanded}
            style={
              expandedMaxHeightPx != null
                ? { maxHeight: expandedMaxHeightPx }
                : {}
            }
          >
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
            {trailingErrorsFooter}
          </div>
        ) : null}
      </StepGroup>
    </div>
  )
}
