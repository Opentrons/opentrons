import {
  ALIGN_CENTER,
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
    ...restProps
  } = props

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
              toggleUpdateValue(!toggleValue)
            }}
            label={isSelected ? onLabel : offLabel}
            isSelected={isSelected}
          />
        </Flex>
        {isSelected ? (
          <InputStepFormField
            {...restProps}
            padding="0"
            showTooltip={false}
            title={fieldTitle}
            units={units}
          />
        ) : null}
      </Flex>
    </ListItem>
  )
}
