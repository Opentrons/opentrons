import { useTranslation } from 'react-i18next'

import { Flex, InputField, SPACING } from '@opentrons/components'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { FieldProps } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/types'

interface InputStepFormFieldProps extends FieldProps {
  title: string
  type?: 'number' | 'text' | 'password'
  setIsPristine?: Dispatch<SetStateAction<boolean>>
  units?: string
  padding?: string
  showTooltip?: boolean
  caption?: string
  formLevelError?: string | null
  placeholder?: string
  // special-casing for the fill Quantity field for stacker :(
  setFillQuantityState?: Dispatch<SetStateAction<string | null>>
  fillQuantityLocalState?: string | null
}

export function InputStepFormField(props: InputStepFormFieldProps): ReactNode {
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
    padding = `0 ${SPACING.spacing16}`,
    tooltipContent,
    caption,
    formLevelError,
    setIsPristine,
    type,
    placeholder,
    setFillQuantityState,
    fillQuantityLocalState,
    ...otherProps
  } = props
  const verifiedValue: string | number | null =
    fillQuantityLocalState ??
    (Array.isArray(value)
      ? value.length
      : typeof value === 'string' || typeof value === 'number'
        ? value
        : null)
  const { t } = useTranslation('tooltip')
  return (
    <Flex padding={padding} width="100%">
      <InputField
        {...otherProps}
        tooltipText={
          showTooltip ? (t(`${tooltipContent}`) ?? undefined) : undefined
        }
        type={type}
        title={title}
        caption={caption}
        name={name}
        error={formLevelError ?? errorToShow}
        onBlur={onFieldBlur}
        onClick={e => {
          e.stopPropagation()
        }}
        onFocus={onFieldFocus}
        onChange={e => {
          if (setFillQuantityState != null) {
            setFillQuantityState(e.currentTarget.value)
          } else {
            updateValue(e.currentTarget.value)
          }
          if (setIsPristine != null) {
            setIsPristine(false)
          }
        }}
        value={verifiedValue}
        units={units}
        placeholder={placeholder}
      />
    </Flex>
  )
}
