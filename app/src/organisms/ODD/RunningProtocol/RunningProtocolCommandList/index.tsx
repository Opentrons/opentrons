import { useEffect, useRef, useState } from 'react'
import { ViewportList } from 'react-viewport-list'

import {
  CommandText,
  getCommandTextData,
  StyledText,
} from '@opentrons/components'

import { CommandIcon } from '/app/molecules/Command'

import { ProtocolPlayPauseHeader } from '../shared/ProtocolPlayPauseHeader'
import styles from './commandlist.module.css'

import type { ReactNode } from 'react'
import type { ViewportListRef } from 'react-viewport-list'
import type { RunStatus } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  RobotType,
} from '@opentrons/shared-data'

interface VisibleIndexRange {
  lowestVisibleIndex: number
  highestVisibleIndex: number
}

export interface RunningProtocolCommandListProps {
  runStatus: RunStatus | null
  robotSideAnalysis: CompletedProtocolAnalysis | null
  robotType: RobotType
  onStop: () => void
  onTogglePlayPause: () => void
  protocolName: string | undefined
  currentRunCommandIndex?: number
  allRunDefs: LabwareDefinition[]
}

export function RunningProtocolCommandList({
  runStatus,
  protocolName,
  robotSideAnalysis,
  robotType,
  onStop,
  onTogglePlayPause,
  currentRunCommandIndex,
  allRunDefs,
}: RunningProtocolCommandListProps): ReactNode {
  const viewPortRef = useRef<HTMLDivElement | null>(null)
  const ref = useRef<ViewportListRef>(null)

  const [visibleRange, setVisibleRange] = useState<VisibleIndexRange>({
    lowestVisibleIndex: 0,
    highestVisibleIndex: 0,
  })

  useEffect(() => {
    // Note (kk:09/25/2023) Need -1 because the element of highestVisibleIndex cannot really readable
    // due to limited space
    const isCurrentCommandVisible =
      currentRunCommandIndex != null &&
      currentRunCommandIndex >= visibleRange.lowestVisibleIndex &&
      currentRunCommandIndex <= visibleRange.highestVisibleIndex - 1

    if (
      ref.current != null &&
      !isCurrentCommandVisible &&
      currentRunCommandIndex != null
    ) {
      ref.current.scrollToIndex(currentRunCommandIndex)
    }
  }, [
    currentRunCommandIndex,
    visibleRange.highestVisibleIndex,
    visibleRange.lowestVisibleIndex,
  ])

  return (
    <div className={styles.container}>
      <ProtocolPlayPauseHeader
        runStatus={runStatus}
        onStop={onStop}
        onTogglePlayPause={onTogglePlayPause}
        protocolName={protocolName}
      />
      {robotSideAnalysis != null ? (
        <div ref={viewPortRef} className={styles.command_list_container}>
          <ViewportList
            viewportRef={viewPortRef}
            ref={ref}
            items={robotSideAnalysis?.commands}
            onViewportIndexesChange={([
              lowestVisibleIndex,
              highestVisibleIndex,
            ]) => {
              if (
                currentRunCommandIndex != null &&
                currentRunCommandIndex >= 0
              ) {
                setVisibleRange({
                  lowestVisibleIndex,
                  highestVisibleIndex,
                })
              }
            }}
            initialIndex={currentRunCommandIndex}
            margin={0}
          >
            {(command, index) => {
              const isCurrentCommand = index === currentRunCommandIndex
              return (
                <div key={command.id} className={styles.command_row}>
                  <StyledText
                    css={styles.command_num}
                    oddStyle="bodyTextRegular"
                  >
                    {index + 1}
                  </StyledText>
                  <div
                    className={`${styles.command_content} ${
                      isCurrentCommand
                        ? styles.current_command
                        : styles.regular_command
                    }`}
                  >
                    <CommandIcon command={command} size="2rem" />
                    <CommandText
                      command={command}
                      commandTextData={getCommandTextData(robotSideAnalysis)}
                      robotType={robotType}
                      className={styles.command_text}
                      isOnDevice={true}
                      allRunDefs={allRunDefs}
                    />
                  </div>
                </div>
              )
            }}
          </ViewportList>
          {/* <Flex css={BOTTOM_ROW_STYLE}></Flex> */}
        </div>
      ) : null}
    </div>
  )
}
