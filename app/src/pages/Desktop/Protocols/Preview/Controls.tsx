import { RefObject, SetStateAction } from 'react'
import { ViewportListRef } from 'react-viewport-list'

import { Chip, Icon } from '@opentrons/components'

import styles from './preview.module.css'

interface ControlsProps {
  numErrors: number
  protocolName: string
  numCommandLength: number
  currentCommandIndex: number
  setCurrentCommandIndex: (value: SetStateAction<number>) => void
  commandListRef: RefObject<ViewportListRef>
  handlePlayPause: () => void
  isPlaying: boolean
}
export function Controls(props: ControlsProps): JSX.Element {
  const {
    numErrors,
    protocolName,
    numCommandLength,
    currentCommandIndex,
    commandListRef,
    setCurrentCommandIndex,
    handlePlayPause,
    isPlaying,
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
                  setCurrentCommandIndex(0)
                }}
              >
                <Icon
                  name="play-icon"
                  width="15px"
                  height="20px"
                  color="#006cfa"
                />
              </button>
              <button className={styles.playButton} onClick={handlePlayPause}>
                <Icon
                  name={isPlaying ? 'play-icon' : 'pause'}
                  width="21px"
                  height="24px"
                  color="white"
                />
              </button>
              <button
                className={styles.fastButton}
                onClick={() => {
                  setCurrentCommandIndex(numCommandLength)
                }}
              >
                <Icon
                  name="play-icon"
                  width="15px"
                  height="20px"
                  color="#006cfa"
                />
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
            setCurrentCommandIndex(nextIndex)
            commandListRef.current?.scrollToIndex(nextIndex)
          }}
        />
      </div>
    </>
  )
}
