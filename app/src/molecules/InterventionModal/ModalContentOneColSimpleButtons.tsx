import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { RadioButton } from '../../atoms/buttons/RadioButton'

export interface ButtonProps {
  label: string
  value: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

export interface ModalContentOneColSimpleButtonsProps {
  headline: string
  firstButton: ButtonProps
  secondButton: ButtonProps
  furtherButtons?: ButtonProps[]
  onSelect?: React.ChangeEventHandler<HTMLInputElement>
  initialSelected?: string
}

export function ModalContentOneColSimpleButtons(
  props: ModalContentOneColSimpleButtonsProps
): JSX.Element {
  const [selected, setSelected] = React.useState<string | null>(
    props.initialSelected ?? null
  )
  const furtherButtons = props.furtherButtons ?? []
  const buttons = [props.firstButton, props.secondButton, ...furtherButtons]
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing16}>
      <StyledText
        fontSize={TYPOGRAPHY.fontSize28}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        lineHeight={TYPOGRAPHY.lineHeight36}
      >
        {props.headline}
      </StyledText>
      <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing4}>
        {buttons.map((buttonProps, idx) => (
          <RadioButton
            key={`button${idx}-${buttonProps.value}`}
            buttonLabel={buttonProps.label}
            buttonValue={buttonProps.value}
            isSelected={selected === buttonProps.value}
            onChange={event => {
              setSelected(event.target.value)
              buttonProps?.onChange && buttonProps.onChange(event)
              props?.onSelect && props.onSelect(event)
            }}
          />
        ))}
      </Flex>
    </Flex>
  )
}
