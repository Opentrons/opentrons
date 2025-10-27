import { useTranslation } from 'react-i18next'

import { MenuItem, MenuList, useOnClickOutside } from '@opentrons/components'

import styles from './perstepoverflowmenu.module.css'

interface PerStepOverflowMenuProps {
  setSelectedPerdStep: (perdStep: number) => void
  setShowPerStepOverflowMenu: (showPerStepOverflowMenu: boolean) => void
  setMilliSecondsPerFrame: (secondsPerFrame: number) => void
}

const PER_STEP_OPTIONS = [2, 3, 4]

export function PerStepOverflowMenu(
  props: PerStepOverflowMenuProps
): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  const {
    setSelectedPerdStep,
    setShowPerStepOverflowMenu,
    setMilliSecondsPerFrame,
  } = props
  const perStepOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowPerStepOverflowMenu(false)
    },
  })

  const handleClick = (seconds: number): void => {
    setSelectedPerdStep(seconds)
    setMilliSecondsPerFrame(seconds * 1000)
    setShowPerStepOverflowMenu(false)
  }

  return (
    <div ref={perStepOverflowWrapperRef} className={styles.container}>
      <MenuList>
        <MenuItem
          onClick={() => {
            handleClick(PER_STEP_OPTIONS[0])
          }}
        >
          {t('seconds_per_step', { seconds: PER_STEP_OPTIONS[0] })}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClick(PER_STEP_OPTIONS[1])
          }}
        >
          {t('seconds_per_step', { seconds: PER_STEP_OPTIONS[1] })}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClick(PER_STEP_OPTIONS[2])
          }}
        >
          {t('seconds_per_step', { seconds: PER_STEP_OPTIONS[2] })}
        </MenuItem>
      </MenuList>
    </div>
  )
}
