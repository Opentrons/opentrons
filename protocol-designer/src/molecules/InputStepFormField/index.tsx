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
  padding?: string
  showTooltip?: boolean
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
    units,
    showTooltip = true,
    padding = SPACING.spacing16,
    ...otherProps
  } = props
  const { t } = useTranslation(['tooltip', 'application'])
  const [targetProps, tooltipProps] = useHoverTooltip()

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={padding}>
      {title !== null ? (
        <Flex gridGap={SPACING.spacing8} paddingBottom={SPACING.spacing8}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {title}
          </StyledText>
          {showTooltip ? (
            <>
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
            </>
          ) : null}
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
        units={units}
      />
    </Flex>
  )
}
