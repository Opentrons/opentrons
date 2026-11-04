import {
  COLORS,
  Icon,
  RadioButton,
  StyledText,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import styles from './vacuumtools.module.css'

import type { ReactNode } from 'react'

/**
 * Generic for 2-button radio groups for various vacuum module control selections
 */
interface VacuumControlsGroupOption<T extends string> {
  value: T
  label: string
  description?: string
}
interface VacuumControlsGroupProps<T extends string> {
  title: string
  options: Array<VacuumControlsGroupOption<T>>
  selectedValue: T
  onChange: (value: T) => void
  titleTooltip?: string
}

export function VacuumControlsGroup<T extends string>(
  props: VacuumControlsGroupProps<T>
): ReactNode {
  const { title, options, selectedValue, onChange, titleTooltip } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  return (
    <div className={styles.controls_group}>
      <div className={styles.controls_group_title_row}>
        <StyledText desktopStyle="bodyDefaultSemiBold">{title}</StyledText>
        {titleTooltip != null && (
          <div {...targetProps}>
            <Icon name="information" size="1rem" color={COLORS.grey60} />
            <Tooltip tooltipProps={tooltipProps}>{titleTooltip}</Tooltip>
          </div>
        )}
      </div>
      <div className={styles.controls_group_options}>
        {options.map(({ label, value, description }) => {
          const isSelected = selectedValue === value
          const buttonLabel = (
            <div className={styles.controls_group_option_label}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {label}
              </StyledText>
              {description != null && (
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={isSelected ? COLORS.white : COLORS.grey60}
                >
                  {description}
                </StyledText>
              )}
            </div>
          )
          return (
            <RadioButton
              key={value}
              buttonLabel={buttonLabel}
              buttonValue={value}
              onChange={() => {
                onChange(value)
              }}
              isSelected={isSelected}
              largeDesktopBorderRadius
            />
          )
        })}
      </div>
    </div>
  )
}
