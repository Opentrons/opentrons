import { useState } from 'react'

import { Chip, COLORS, Icon, OverflowBtn } from '@opentrons/components'

import { ControlsOverflowMenu } from './ControlsOverflowMenu'
import styles from './preview.module.css'
import {
  getNextGroupFirstCommandId,
  getPreviousGroupFirstCommandId,
} from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { GroupedCommands } from '/app/redux/protocol-storage'

interface ControlsProps {
  numErrors: number
  protocolName: string
  numCommandLength: number
  currentCommandIndex: number
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  handlePlayPause: () => void
  isPlaying: boolean
  commands: RunTimeCommand[]
  groupedCommands: GroupedCommands | null
  setShowDeckRenders: Dispatch<SetStateAction<boolean>>
  showDeckRenders: boolean
}
export function Controls(props: ControlsProps): JSX.Element {
  const {
    numErrors,
    protocolName,
    numCommandLength,
    currentCommandIndex,
    setSelectedCommand,
    handlePlayPause,
    isPlaying,
    commands,
    groupedCommands,
    showDeckRenders,
    setShowDeckRenders,
  } = props
  const [showOverflowMenu, setShowOverflowMenu] = useState<boolean>(false)
  const currentCommandId = commands[currentCommandIndex].id
  const nextGroupFirstCommandId = getNextGroupFirstCommandId(
    groupedCommands,
    currentCommandId
  )
  const previousGroupFirstCommandId = getPreviousGroupFirstCommandId(
    groupedCommands,
    currentCommandId
  )

  const handleBack = (): void => {
    if (previousGroupFirstCommandId != null) {
      setSelectedCommand(previousGroupFirstCommandId)
    } else {
      setSelectedCommand(commands[0].id)
    }
  }
  const handleForward = (): void => {
    if (nextGroupFirstCommandId != null) {
      setSelectedCommand(nextGroupFirstCommandId)
    } else {
      setSelectedCommand(commands[commands.length - 1].id)
    }
  }

  const handleOverflowMenuClick = (showRenders: boolean): void => {
    setShowDeckRenders(showRenders)
    setShowOverflowMenu(false)
  }

  return (
    <>
      {showOverflowMenu ? (
        <ControlsOverflowMenu
          handleDeckView={showRenders => {
            handleOverflowMenuClick(showRenders)
          }}
          showsRenders={showDeckRenders}
        />
      ) : null}
      <div className={styles.container}>
        <div className={styles.controls_container}>
          <div className={styles.all_controls_info}>
            <div className={styles.controls_info}>
              <div className={styles.heading_text}>{protocolName}</div>
              <div className={styles.max_content_size}>
                {numErrors === 0 ? (
                  <Chip type="success" chipSize="small" text="No errors" />
                ) : (
                  <Chip type="error" text={`${numErrors} errors`} />
                )}
              </div>
            </div>
            <div className={styles.buttons}>
              <button className={styles.fast_button} onClick={handleBack}>
                <Icon
                  name="skip-backward"
                  width="1.5625rem"
                  height="1.875rem"
                  color={COLORS.blue50}
                />
              </button>
              <button className={styles.play_button} onClick={handlePlayPause}>
                <Icon
                  name={isPlaying ? 'pause' : 'play-icon'}
                  width="1.5625rem"
                  height="1.5rem"
                  color="white"
                />
              </button>
              <button className={styles.fast_button} onClick={handleForward}>
                <Icon
                  name="skip-forward"
                  width="1.5625rem"
                  height="1.875rem"
                  color={COLORS.blue50}
                />
              </button>
            </div>
          </div>
          <div className={styles.controls_overflow_btn}>
            <OverflowBtn
              onClick={() => {
                setShowOverflowMenu(prev => !prev)
              }}
            />
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={numCommandLength}
          value={currentCommandIndex + 1}
          className={styles.range_input}
          style={{
            //  @ts-expect-error: TODO figure out how to fix this - seems like
            //  an issue with thinking i'm using styled-components?
            '--progress': `${
              ((currentCommandIndex + 1) / numCommandLength) * 100
            }%`,
          }}
          onChange={e => {
            const nextIndex = Number(e.target.value) - 1
            setSelectedCommand(commands[nextIndex].id)
          }}
        />
      </div>
    </>
  )
}
