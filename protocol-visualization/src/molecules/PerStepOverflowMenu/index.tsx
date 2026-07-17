import { MenuItem, MenuList, useOnClickOutside } from '@opentrons/components'

import styles from './perstepoverflowmenu.module.css'

interface PerStepOverflowMenuProps {
  setShowPerStepOverflowMenu: (showPerStepOverflowMenu: boolean) => void
  setMilliSecondsPerFrame: (secondsPerFrame: number) => void
}

const PLAYBACK_SPEED_OPTIONS = [
  { label: '4x', seconds: 0.25 },
  { label: '2x', seconds: 0.5 },
  { label: '1x', seconds: 1.0 },
  { label: '0.5x', seconds: 2.0 },
  { label: '0.33x', seconds: 3.0 },
]

export function PerStepOverflowMenu(
  props: PerStepOverflowMenuProps
): JSX.Element {
  const { setShowPerStepOverflowMenu, setMilliSecondsPerFrame } = props
  const perStepOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowPerStepOverflowMenu(false)
    },
  })

  const handleClick = (seconds: number): void => {
    setMilliSecondsPerFrame(seconds * 1000)
    setShowPerStepOverflowMenu(false)
  }

  return (
    <div ref={perStepOverflowWrapperRef} className={styles.container}>
      <MenuList>
        {PLAYBACK_SPEED_OPTIONS.map(option => (
          <MenuItem
            key={option.seconds}
            onClick={() => {
              handleClick(option.seconds)
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </MenuList>
    </div>
  )
}
