import { useEffect, useRef } from 'react'
import clsx from 'clsx'

import { COLORS, CommandText } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { CommandIcon } from '/app/molecules/Command'

import styles from './annotatedsteps.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'

interface IndividualCommandProps {
  scrollTargetId: string | null
  listElement: HTMLElement | null
  command: RunTimeCommand
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  isHighlighted: boolean
  allRunDefs: LabwareDefinition[]
  fromGroup: boolean
  commandNumber: number
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
}
export function IndividualCommand({
  command,
  analysis,
  isHighlighted,
  allRunDefs,
  setSelectedCommand,
  fromGroup,
  commandNumber,
  scrollTargetId,
  listElement,
}: IndividualCommandProps): JSX.Element {
  const commandRef = useRef<HTMLDivElement | null>(null)
  const iconColor = isHighlighted ? COLORS.purple50 : COLORS.grey50

  useEffect(() => {
    if (!isHighlighted || commandRef.current == null) return
    if (command.id !== scrollTargetId) return

    requestAnimationFrame(() => {
      const commandEl = commandRef.current
      if (commandEl == null) return

      const groupExpandedEl =
        fromGroup === true
          ? commandEl.closest<HTMLElement>(
              `.${styles.annotated_group_expanded}`
            )
          : null

      const container: HTMLElement | null =
        groupExpandedEl instanceof HTMLElement
          ? groupExpandedEl
          : (listElement ??
            commandEl.closest<HTMLElement>('[role="list"]') ??
            null)

      if (container == null) {
        commandEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        })
        return
      }

      const containerRect = container.getBoundingClientRect()
      const commandRect = commandEl.getBoundingClientRect()
      const isBelow = commandRect.bottom >= containerRect.bottom - 8
      const isAbove = commandRect.top <= containerRect.top + 1
      if (!isBelow && !isAbove) return

      const nextTop =
        container.scrollTop + (commandRect.top - containerRect.top)
      container.scrollTo({
        behavior: 'smooth',
        top: Math.max(0, nextTop),
      })
    })
  }, [isHighlighted, scrollTargetId, command.id, listElement, fromGroup])

  const commandWrapStyle = clsx(styles.individual_command_wrap, {
    [styles.individual_command_wrap_from_group]: fromGroup && !isHighlighted,
    [styles.individual_command_wrap_highlighted]: isHighlighted,
  })

  const individualCommandContainerStyle = clsx(
    styles.individual_command_container,
    {
      [styles.individual_command_container_group]: fromGroup,
    }
  )

  return (
    <div className={individualCommandContainerStyle} ref={commandRef}>
      <div
        className={commandWrapStyle}
        onClick={() => {
          setSelectedCommand?.(command.id)
        }}
      >
        <div className={styles.individual_command} key={command.id}>
          <div className={styles.individual_command_header}>
            <CommandIcon command={command} color={iconColor} />
            <div className={styles.individual_command_text}>
              <CommandText
                command={command}
                robotType={analysis?.robotType ?? FLEX_ROBOT_TYPE}
                commandTextData={analysis}
                allRunDefs={allRunDefs}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
