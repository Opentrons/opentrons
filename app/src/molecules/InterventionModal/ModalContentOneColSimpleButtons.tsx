import { useState } from 'react'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  RadioButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { OneColumn } from './OneColumn'

import type { ChangeEventHandler } from 'react'

export interface ButtonProps {
  label: string
  value: string
  onChange?: ChangeEventHandler<HTMLInputElement>
}

export interface ModalContentOneColSimpleButtonsProps {
  headline: string
  buttons: ButtonProps[]
  onSelect?: ChangeEventHandler<HTMLInputElement>
  initialSelected?: string
  subText?: string
}

export function ModalContentOneColSimpleButtons(
  props: ModalContentOneColSimpleButtonsProps
): JSX.Element {
  const [selected, setSelected] = useState<string | null>(
    props.initialSelected ?? null
  )
  return (
    <OneColumn>
      <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing16}>
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSize28}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          lineHeight={TYPOGRAPHY.lineHeight36}
        >
          {props.headline}
        </LegacyStyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing4}>
          {props.buttons.map((buttonProps, idx) => (
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
          {props.subText != null ? (
            <LegacyStyledText
              fontSize={TYPOGRAPHY.fontSize22}
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              lineHeight={TYPOGRAPHY.lineHeight28}
            >
              {props.subText}
            </LegacyStyledText>
          ) : null}
        </Flex>
      </Flex>
    </OneColumn>
  )
}
