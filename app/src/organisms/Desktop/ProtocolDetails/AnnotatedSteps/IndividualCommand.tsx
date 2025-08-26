import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import { COLORS, CommandText, StyledText } from '@opentrons/components'
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
}: IndividualCommandProps): JSX.Element {
  const [showNumber, setShowNumber] = useState<boolean>(false)
  const commandRef = useRef<HTMLDivElement | null>(null)
  const iconColor = isHighlighted ? COLORS.purple50 : COLORS.grey50

  useEffect(() => {
    if (isHighlighted && commandRef.current && command.id === scrollTargetId) {
      requestAnimationFrame(() => {
        commandRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        })
      })
    }
  }, [isHighlighted, scrollTargetId, command])

  const commandWrapStyle = clsx(styles.individual_command_wrap, {
    [styles.individual_command_wrap_highlighted]: isHighlighted,
  })

  const individualCommandContainerStyle = clsx(
    styles.individual_command_container,
    {
      [styles.rogue_individual_command_container]: fromGroup,
    }
  )

  return (
    <div
      className={individualCommandContainerStyle}
      ref={commandRef}
      onMouseEnter={() => {
        setShowNumber(true)
      }}
      onMouseLeave={() => {
        setShowNumber(false)
      }}
    >
      <div
        className={commandWrapStyle}
        onClick={() => {
          setSelectedCommand?.(command.id)
        }}
      >
        <div className={styles.individual_command} key={command.id}>
          <div className={styles.individual_command_header}>
            <CommandIcon command={command} color={iconColor} />
            <CommandText
              command={command}
              robotType={analysis?.robotType ?? FLEX_ROBOT_TYPE}
              commandTextData={analysis}
              allRunDefs={allRunDefs}
            />
          </div>
          {showNumber ? (
            <StyledText color={COLORS.grey60} desktopStyle="captionRegular">
              {commandNumber}
            </StyledText>
          ) : null}
        </div>
      </div>
    </div>
  )
}
