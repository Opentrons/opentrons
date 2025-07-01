import { Dispatch, RefObject, SetStateAction } from 'react'
import { ViewportListRef } from 'react-viewport-list'

import { Chip, Icon } from '@opentrons/components'
import { RunTimeCommand } from '@opentrons/shared-data'

import styles from './preview.module.css'

interface ControlsProps {
  numErrors: number
  protocolName: string
  numCommandLength: number
  currentCommandIndex: number
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  commandListRef: RefObject<ViewportListRef>
  handlePlayPause: () => void
  isPlaying: boolean
  commands: RunTimeCommand[]
}
export function Controls(props: ControlsProps): JSX.Element {
  const {
    numErrors,
    protocolName,
    numCommandLength,
    currentCommandIndex,
    commandListRef,
    setSelectedCommand,
    handlePlayPause,
    isPlaying,
    commands,
  } = props

  return (
    <>
      <div className={styles.container}>
        <div className={styles.controlsContainer}>
          <div className={styles.allControlsInfo}>
            <div className={styles.controlsInfo}>
              <div className={styles.headingText}>{protocolName}</div>
              <div className={styles.maxContent}>
                {numErrors === 0 ? (
                  <Chip type="success" chipSize="small" text="No errors" />
                ) : (
                  <Chip type="error" text={`${numErrors} errors`} />
                )}
              </div>
            </div>
            <div className={styles.buttons}>
              <button
                className={styles.fastButton}
                onClick={() => {
                  setSelectedCommand(commands[0].id)
                }}
              >
                <Icon name="ot-end" width="25px" height="30px" color="#006cfa" />
              </button>
              <button className={styles.playButton} onClick={handlePlayPause}>
                <Icon
                  name={isPlaying ? 'pause' : 'play-icon'}
                  width="21px"
                  height="24px"
                  color="white"
                />
              </button>
              <button
                className={styles.fastButton}
                onClick={() => {
                  setSelectedCommand(commands[commands.length - 1].id)
                }}
              >
                <Icon name="ot-start" width="25px" height="30px" color="#006cfa" />
              </button>
            </div>
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={numCommandLength}
          value={currentCommandIndex + 1}
          className={styles.rangeInput}
          style={{
            '--progress': `${
              ((currentCommandIndex + 1) / numCommandLength) * 100
            }%`,
          }}
          onChange={e => {
            const nextIndex = Number(e.target.value) - 1
            setSelectedCommand(commands[nextIndex].id)
            commandListRef.current?.scrollToIndex(nextIndex)
          }}
        />
      </div>
    </>
  )
}
