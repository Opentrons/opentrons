import clsx from 'clsx'
import clamp from 'lodash/clamp'

import { StyledText } from '@opentrons/components'

import { IconButton } from '/app/atoms/buttons/IconButton'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './cameracontrols.module.css'

import type { ReactNode } from 'react'

const SETTING_TILE = [1, 2, 3, 4]
// Each tile adjusts the setting by 25%.
const TILE_VALUE = 25
const HIGHEST_VALUE = 100
const LOWEST_VALUE = 0

export interface CameraTileSettingProps {
  value: number
  adjustValue: (value: number) => void
  title: string
  subtext: string
  isLoading: boolean
  returnToHomeView: () => void
}

export function CameraTileSetting({
  title,
  returnToHomeView,
  value,
  subtext,
  adjustValue,
  isLoading,
}: CameraTileSettingProps): ReactNode {
  const adjustedValue = roundValueToValidPercentage(value)

  // We intentionally avoid adjusting pre-existing values to a number divisible
  // by 25% until a click occurs.
  const handleClick = (changeType: 'up' | 'down'): void => {
    const step = changeType === 'up' ? TILE_VALUE : -1 * TILE_VALUE
    const nextValue = clamp(adjustedValue + step, LOWEST_VALUE, HIGHEST_VALUE)

    adjustValue(nextValue)
  }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={title}
        onClickBack={returnToHomeView}
        backIconName={isLoading ? 'ot-spinner' : 'back'}
      />
      <div className={styles.content_container}>
        <StyledText oddStyle="level4HeaderRegular">{subtext}</StyledText>
        <div className={styles.tile_setting_container}>
          <IconButton
            disabled={adjustedValue === LOWEST_VALUE}
            onClick={() => {
              handleClick('down')
            }}
            data-testid="TouchscreenSetting_decrease"
            iconName="minus"
          />
          <div className={styles.tile_container}>
            {SETTING_TILE.map(level => (
              <SettingTile
                key={level}
                isActive={adjustedValue >= level * TILE_VALUE}
              />
            ))}
          </div>
          <IconButton
            disabled={adjustedValue === HIGHEST_VALUE}
            onClick={() => {
              handleClick('up')
            }}
            data-testid="TouchscreenSetting_increase"
            iconName="plus"
          />
        </div>
      </div>
    </div>
  )
}

function SettingTile({ isActive }: { isActive: boolean }): ReactNode {
  return (
    <div
      className={clsx(
        styles.tile,
        isActive ? styles.tile_active : styles.tile_inactive
      )}
    />
  )
}

// Round a setting value to a valid percentage, 0%, 25%, 50%, 75%, or 100%.
const roundValueToValidPercentage = (value: number): number => {
  return Math.round(value / TILE_VALUE) * TILE_VALUE
}
