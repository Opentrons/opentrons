import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { InputStepFormField } from '../InputStepFormField'
import { ToggleButton } from '../../atoms/ToggleButton'
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
          <ToggleButton
            onClick={() => {
              toggleUpdateValue(!toggleValue)
            }}
            label={isSelected ? onLabel : offLabel}
            toggledOn={isSelected}
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
