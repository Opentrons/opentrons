import {
  ALIGN_CENTER,
  Btn,
  Check,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListButton,
  SPACING,
  StyledText,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import type { ReactNode } from 'react'
import type { FieldProps } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/types'

interface CheckboxExpandStepFormFieldProps {
  title: string
  fieldProps: FieldProps
  tooltipOverride?: string
  children?: ReactNode
  testId?: string
}
export function CheckboxExpandStepFormField(
  props: CheckboxExpandStepFormFieldProps
): ReactNode {
  const { children, title, tooltipOverride, fieldProps } = props

  const {
    value,
    updateValue,
    tooltipContent = tooltipOverride,
    disabled = false,
  } = fieldProps

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top-start',
  })
  return (
    <>
      <ListButton
        type="noActive"
        padding={SPACING.spacing12}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            updateValue(!value)
          }
        }}
        color={disabled ? COLORS.grey40 : COLORS.black90}
      >
        <Flex
          width="100%"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          {...targetProps}
        >
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <>
              <StyledText desktopStyle="bodyDefaultRegular">{title}</StyledText>
              <Btn
                onClick={() => {
                  updateValue(!value)
                }}
                disabled={disabled}
              >
                <Check
                  color={COLORS.blue50}
                  isChecked={value === true}
                  disabled={disabled}
                />
              </Btn>
            </>
          </Flex>
          {children}
        </Flex>
      </ListButton>
      {tooltipContent != null ? (
        <Tooltip tooltipProps={tooltipProps}>{tooltipContent}</Tooltip>
      ) : null}
    </>
  )
}
