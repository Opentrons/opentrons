import { useTranslation } from 'react-i18next'

import { MenuItem, MenuList, useOnClickOutside } from '@opentrons/components'

import styles from './perstepoverflowmenu.module.css'

interface PerStepOverflowMenuProps {
  setShowPerStepOverflowMenu: (showPerStepOverflowMenu: boolean) => void
  setMilliSecondsPerFrame: (secondsPerFrame: number) => void
}

const PER_STEP_OPTIONS = [0.25, 0.5, 1, 2, 3]

export function PerStepOverflowMenu(
  props: PerStepOverflowMenuProps
): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
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
        {PER_STEP_OPTIONS.map(seconds => (
          <MenuItem
            key={seconds}
            onClick={() => {
              handleClick(seconds)
            }}
          >
            {t('seconds_per_step', { seconds })}
          </MenuItem>
        ))}
      </MenuList>
    </div>
  )
}
