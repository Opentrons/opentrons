import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { Toggle } from '../../atoms'
import { InputStepFormField } from '../InputStepFormField'
import type { FieldProps } from '../../pages/Designer/ProtocolSteps/StepForm/types'

interface ToggleExpandStepFormFieldProps extends FieldProps {
  title: string
  fieldTitle: string
  isSelected: boolean
  units: string
  onLabel: string
  offLabel: string
  toggleUpdateValue: (value: unknown) => void
  toggleValue: unknown
  caption?: string
}
export function ToggleExpandStepFormField(
  props: ToggleExpandStepFormFieldProps
): JSX.Element {
  const {
    title,
    isSelected,
    onLabel,
    offLabel,
    fieldTitle,
    units,
    toggleUpdateValue,
    toggleValue,
    caption,
    ...restProps
  } = props

  const onToggleUpdateValue = (): void => {
    if (typeof toggleValue === 'boolean') {
      toggleUpdateValue(!toggleValue)
    } else if (toggleValue === 'engage' || toggleValue === 'disengage') {
      const newToggleValue = toggleValue === 'engage' ? 'disengage' : 'engage'
      toggleUpdateValue(newToggleValue)
    }
  }

  return (
    <ListItem type="noActive">
      <Flex
        padding={SPACING.spacing12}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
          <StyledText desktopStyle="bodyDefaultRegular">{title}</StyledText>
          <Toggle
            onClick={() => {
              onToggleUpdateValue()
            }}
            label={isSelected ? onLabel : offLabel}
            isSelected={isSelected}
          />
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing10}>
          {isSelected ? (
            <InputStepFormField
              {...restProps}
              padding="0"
              showTooltip={false}
              title={fieldTitle}
              units={units}
            />
          ) : null}
          {isSelected && caption != null ? (
            <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
              {caption}
            </StyledText>
          ) : null}
        </Flex>
      </Flex>
    </ListItem>
  )
}
