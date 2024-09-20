import * as React from 'react'
import {
  CheckboxField,
  Flex,
  SPACING,
  TOOLTIP_TOP,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import type { Placement } from '@opentrons/components'
import type { FieldProps } from '../../pages/Designer/ProtocolSteps/StepForm/types'

type CheckboxStepFormFieldProps = FieldProps & {
  children?: React.ReactElement
  label?: string
  tooltipContent?: React.ReactNode
  tooltipPlacement?: Placement
}

export function CheckboxStepFormField(
  props: CheckboxStepFormFieldProps
): JSX.Element {
  const {
    disabled,
    isIndeterminate,
    label,
    name,
    tooltipContent,
    updateValue,
    value,
    children,
    tooltipPlacement = TOOLTIP_TOP,
  } = props

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: tooltipPlacement,
  })
  return (
    <>
      {tooltipContent && (
        <Tooltip tooltipProps={tooltipProps}>{tooltipContent}</Tooltip>
      )}
      <Flex gridGap={SPACING.spacing8} padding={SPACING.spacing16}>
        <Flex {...targetProps}>
          <CheckboxField
            value={disabled ? false : Boolean(value)}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              updateValue(!value)
            }}
            label={label}
            name={name}
            disabled={disabled}
          />
        </Flex>
        {value && !disabled && !isIndeterminate ? children : null}
      </Flex>
    </>
  )
}
