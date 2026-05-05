import { useCallback, useEffect, useMemo, useState } from 'react'

import { COLORS, Icon, StyledText } from '@opentrons/components'

import { AnnotatedGroup } from './AnnotatedGroup'
import styles from './annotatedsteps.module.css'
import { IndividualCommand } from './IndividualCommand'

import type { Dispatch, SetStateAction } from 'react'
import type { RowComponentProps } from 'react-window'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { LeafNode } from '/app/redux/protocol-storage'
import type { ItemData } from './index'

interface GroupAnnotatedStepRowProps {
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
  milliSecondsPerFrame: number
  isGlobalPlaying: boolean
  t: (key: string) => string
}

function GroupAnnotatedStepRow(props: GroupAnnotatedStepRowProps): JSX.Element {
  const {
    subCommands,
    milliSecondsPerFrame,
    isGlobalPlaying,
    setSelectedCommand,
    handlePause,
    t,
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
        const idx = commandIds.indexOf(prevId ?? '')
        if (idx === -1) {
          return commandIds[0] ?? null
        }
        const nextIdx = (idx + 1) % commandIds.length
        return commandIds[nextIdx] ?? null
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

  return (
    <AnnotatedGroup
      {...annotatedGroupProps}
      subCommands={subCommands}
      setSelectedCommand={setSelectedCommand}
      handlePause={handlePause}
      headerLeading={
        showPlayControl ? (
          <button
            type="button"
            className={styles.group_play_button}
            onClick={event => {
              event.stopPropagation()
              toggleGroupPlay()
            }}
            aria-label={isGroupPlaying ? 'stop step group' : 'play step group'}
          >
            <Icon
              name={isGroupPlaying ? 'pause-circle' : 'play-circle'}
              size="1.25rem"
              color={iconColor}
            />
          </button>
        ) : undefined
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
            t={data.t}
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
        ) : (
          <div className={styles.annotated_steps_error_wrapper}>
            {row.errors.map(error => (
              <div
                className={styles.annotated_steps_error_container}
                key={error.id}
                onClick={() => {
                  data.onShowErrorDetails()
                }}
              >
                <div className={styles.annotated_steps_header}>
                  <Icon name="ot-alert" size="1rem" color={COLORS.red60} />
                  <StyledText
                    desktopStyle="captionSemiBold"
                    color={COLORS.red60}
                  >
                    {data.t('step_error')}
                  </StyledText>
                </div>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {error.detail}
                </StyledText>
              </div>
            ))}
            <div className={styles.annotated_steps_final_command}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {data.t('unable_to_show_steps_past_errors')}
              </StyledText>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
