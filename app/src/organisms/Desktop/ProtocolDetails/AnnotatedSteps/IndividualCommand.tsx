import { useEffect, useRef } from 'react'
import clsx from 'clsx'

import { COLORS, CommandText } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { CommandIcon } from '/app/molecules/Command'

import styles from './annotatedSteps.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'

interface IndividualCommandProps {
  command: RunTimeCommand
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  isHighlighted: boolean
  allRunDefs: LabwareDefinition[]
  fromGroup: boolean
  setSelectedCommand?: Dispatch<SetStateAction<string | null>>
}
export function IndividualCommand({
  command,
  analysis,
  isHighlighted,
  allRunDefs,
  setSelectedCommand,
  fromGroup,
}: IndividualCommandProps): JSX.Element {
  const commandRef = useRef<HTMLDivElement | null>(null)
  const iconColor = isHighlighted ? COLORS.purple50 : COLORS.grey50

  useEffect(() => {
    if (isHighlighted && commandRef.current) {
      commandRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [isHighlighted])

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
    <div className={individualCommandContainerStyle} ref={commandRef}>
      <div
        className={commandWrapStyle}
        onClick={() => {
          setSelectedCommand?.(command.id)
        }}
      >
        <div className={styles.individual_command} key={command.id}>
          <CommandIcon command={command} color={iconColor} />
          <CommandText
            command={command}
            robotType={analysis?.robotType ?? FLEX_ROBOT_TYPE}
            color={COLORS.black90}
            commandTextData={analysis}
            allRunDefs={allRunDefs}
          />
        </div>
      </div>
    </div>
  )
}
