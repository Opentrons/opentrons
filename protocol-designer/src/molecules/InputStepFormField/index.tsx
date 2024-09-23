import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  InputField,
  SPACING,
  StyledText,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { getFieldDefaultTooltip } from '../../components/StepEditForm/utils'

import type { FieldProps } from '../../components/StepEditForm/types'

interface InputStepFormFieldProps extends FieldProps {
  title: string
  units: string
}

export function InputStepFormField(
  props: InputStepFormFieldProps
): JSX.Element {
  const {
    errorToShow,
    onFieldBlur,
    onFieldFocus,
    updateValue,
    value,
    name,
    title,
    ...otherProps
  } = props
  const { t } = useTranslation(['tooltip', 'application'])
  const [targetProps, tooltipProps] = useHoverTooltip()

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing16}>
      {title !== null ? (
        <Flex gridGap={SPACING.spacing8} paddingBottom={SPACING.spacing8}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {title}
          </StyledText>
          <Flex {...targetProps}>
            <Icon
              name="information"
              size={SPACING.spacing12}
              color={COLORS.grey60}
              data-testid="information_icon"
            />
          </Flex>
          <Tooltip tooltipProps={tooltipProps}>
            {getFieldDefaultTooltip(name, t)}
          </Tooltip>
        </Flex>
      ) : null}
      <InputField
        {...otherProps}
        name={name}
        error={errorToShow}
        onBlur={onFieldBlur}
        onFocus={onFieldFocus}
        onChange={e => {
          updateValue(e.currentTarget.value)
        }}
        value={value ? String(value) : null}
        units={t('application:units.microliter')}
      />
    </Flex>
  )
}
