import { useTranslation } from 'react-i18next'
import { Flex, InputField, SPACING } from '@opentrons/components'
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

  return (
    <Flex padding={padding} width="100%">
      <InputField
        {...otherProps}
        tooltipText={
          showTooltip ? t(`${tooltipContent}`) ?? undefined : undefined
        }
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
