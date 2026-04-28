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
    if (isHighlighted && commandRef.current && command.id === scrollTargetId) {
      requestAnimationFrame(() => {
        const container =
          listElement ?? commandRef.current?.closest('[role="list"]')
        if (container == null) {
          commandRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          })
          return
        }
        const containerRect = container.getBoundingClientRect()
        const commandRect = commandRef.current?.getBoundingClientRect()
        if (commandRect == null) return
        const isBelow = commandRect.bottom >= containerRect.bottom - 8
        const isAbove = commandRect.top <= containerRect.top + 1
        if (!isBelow && !isAbove) return
        if (container instanceof HTMLElement) {
          const nextTop =
            container.scrollTop + (commandRect.top - containerRect.top)
          container.scrollTo({
            behavior: 'smooth',
            top: Math.max(0, nextTop),
          })
          return
        }
        commandRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: isBelow ? 'start' : 'nearest',
          inline: 'nearest',
        })
      })
    }
  }, [isHighlighted, scrollTargetId, command, listElement])

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
