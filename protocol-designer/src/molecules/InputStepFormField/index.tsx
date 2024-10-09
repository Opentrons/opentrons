import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  InputField,
  SPACING,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import type { FieldProps } from '../../components/StepEditForm/types'

interface InputStepFormFieldProps extends FieldProps {
  title: string
  units?: string
  padding?: string
  showTooltip?: boolean
  caption?: string
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
    tooltipContent,
    caption,
    ...otherProps
  } = props
  const { t } = useTranslation('tooltip')
  const [targetProps, tooltipProps] = useHoverTooltip()

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={padding}>
      <Flex gridGap={SPACING.spacing8} paddingBottom={SPACING.spacing8}>
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
              {t(`${tooltipContent}`)}
            </Tooltip>
          </>
        ) : null}
      </Flex>
      <InputField
        {...otherProps}
        title={title}
        caption={caption}
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
