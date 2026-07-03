import { useCallback, useEffect, useMemo, useState } from 'react'

import { COLORS, Icon } from '@opentrons/components'

import { AnnotatedGroup } from './AnnotatedGroup'
import styles from './annotatedsteps.module.css'
import { IndividualCommand } from './IndividualCommand'
import { ProtocolAnalysisErrorsContent } from './ProtocolAnalysisErrorsContent'
import { ProtocolAnalysisPastStepsMessage } from './ProtocolAnalysisPastStepsMessage'

import type { Dispatch, SetStateAction } from 'react'
import type { RowComponentProps } from 'react-window'
import type {
  AnalysisError,
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { LeafNode } from '/app/redux/protocol-storage'
import type { ItemData } from './index'

interface GroupAnnotatedStepRowProps {
  scrollTargetId: string | null
  listElement: HTMLElement | null
  listViewportHeight: number
  annotationType: string
  subCommands: LeafNode[]
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  allRunDefs: LabwareDefinition[]
  // this is the command index at the start of the group
  commandStartNumber: number
  annotationDescription: string
  milliSecondsPerFrame: number
  isGlobalPlaying: boolean
  tI18n: (key: string) => string
  onShowErrorDetails: () => void
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
  handlePause?: () => void
  trailingErrors?: AnalysisError[]
}

function GroupAnnotatedStepRow(props: GroupAnnotatedStepRowProps): JSX.Element {
  const {
    subCommands,
    milliSecondsPerFrame,
    isGlobalPlaying,
    setSelectedCommand,
    handlePause,
    tI18n,
    trailingErrors,
    onShowErrorDetails,
    ...annotatedGroupProps
  } = props

  const [isGroupPlaying, setIsGroupPlaying] = useState(false)

  const commandIds = useMemo(
    () => subCommands.map(sub => sub.command.id),
    [subCommands]
  )

  useEffect(() => {
    if (isGlobalPlaying) {
      setIsGroupPlaying(false)
    }
  }, [isGlobalPlaying])

  useEffect(() => {
    if (
      !isGroupPlaying ||
      setSelectedCommand == null ||
      commandIds.length === 0
    ) {
      return
    }

    const intervalId = globalThis.setInterval(() => {
      setSelectedCommand(prevId => {
        const commandIndex = commandIds.indexOf(prevId ?? '')
        if (commandIndex === -1) {
          return commandIds[0] ?? null
        }
        const nextCommandIndex = (commandIndex + 1) % commandIds.length
        return commandIds[nextCommandIndex] ?? null
      })
    }, milliSecondsPerFrame)

    return () => {
      globalThis.clearInterval(intervalId)
    }
  }, [isGroupPlaying, commandIds, milliSecondsPerFrame, setSelectedCommand])

  const toggleGroupPlay = useCallback((): void => {
    if (setSelectedCommand == null || commandIds.length === 0) {
      return
    }

    if (isGroupPlaying) {
      setIsGroupPlaying(false)
    } else {
      handlePause?.()
      const firstId = commandIds[0]
      if (firstId != null) {
        setSelectedCommand(firstId)
      }
      setIsGroupPlaying(true)
    }
  }, [setSelectedCommand, commandIds, isGroupPlaying, handlePause])

  const showPlayControl = setSelectedCommand != null && commandIds.length > 0

  const isAnyStepHighlighted = subCommands.some(sub => sub.isHighlighted)
  const iconColor = isAnyStepHighlighted ? COLORS.purple50 : COLORS.grey60

  const handlePlayButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.stopPropagation()
    toggleGroupPlay()
  }

  return (
    <AnnotatedGroup
      {...annotatedGroupProps}
      subCommands={subCommands}
      setSelectedCommand={setSelectedCommand}
      handlePause={handlePause}
      trailingErrorsFooter={
        trailingErrors != null && trailingErrors.length > 0 ? (
          <ProtocolAnalysisErrorsContent
            errors={trailingErrors}
            onShowErrorDetails={onShowErrorDetails}
            t={tI18n}
            inGroup
            showPastStepsMessage={false}
          />
        ) : null
      }
      headerLeading={
        showPlayControl ? (
          <button
            type="button"
            className={styles.group_play_button}
            onClick={handlePlayButtonClick}
            aria-label={isGroupPlaying ? 'stop step group' : 'play step group'}
          >
            <Icon
              name={isGroupPlaying ? 'pause-circle' : 'play-circle'}
              size="1.25rem"
              color={iconColor}
            />
          </button>
        ) : null
      }
    />
  )
}

export function AnnotatedStepsRowItem(
  props: RowComponentProps<ItemData>
): JSX.Element {
  const { index, style, ariaAttributes, ...data } = props
  const row = data.rows[index]

  return (
    <div style={style} {...ariaAttributes}>
      <div className={styles.annotated_steps_row}>
        {row.type === 'group' ? (
          <GroupAnnotatedStepRow
            scrollTargetId={data.scrollTargetId}
            listElement={data.listElement}
            listViewportHeight={data.listViewportHeight}
            analysis={data.analysis}
            annotationType={row.annotationType}
            subCommands={row.group.subCommands}
            commandStartNumber={row.commandStartNumber}
            allRunDefs={data.allRunDefs}
            setSelectedCommand={data.setSelectedCommand}
            handlePause={data.handlePause}
            annotationDescription={row.annotationDescription}
            milliSecondsPerFrame={data.milliSecondsPerFrame}
            isGlobalPlaying={data.isGlobalPlaying}
            tI18n={data.t}
            trailingErrors={row.trailingErrors}
            onShowErrorDetails={data.onShowErrorDetails}
          />
        ) : row.type === 'command' ? (
          <IndividualCommand
            scrollTargetId={data.scrollTargetId}
            listElement={data.listElement}
            fromGroup={false}
            command={row.command}
            isHighlighted={row.isHighlighted}
            analysis={data.analysis}
            allRunDefs={data.allRunDefs}
            setSelectedCommand={data.setSelectedCommand}
            commandNumber={row.commandNumber}
          />
        ) : row.type === 'errors_past_steps_message' ? (
          <ProtocolAnalysisPastStepsMessage t={data.t} />
        ) : (
          <ProtocolAnalysisErrorsContent
            errors={row.errors}
            onShowErrorDetails={data.onShowErrorDetails}
            t={data.t}
          />
        )}
      </div>
    </div>
  )
}
