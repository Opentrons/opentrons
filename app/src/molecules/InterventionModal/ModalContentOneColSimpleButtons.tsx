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

import type { ChangeEventHandler, ReactNode } from 'react'

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
  scroll?: boolean
}

export function ModalContentOneColSimpleButtons(
  props: ModalContentOneColSimpleButtonsProps
): ReactNode {
  const [selected, setSelected] = useState<string | null>(
    props.initialSelected ?? null
  )
  return (
    <OneColumn height="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gap={SPACING.spacing16}
        height="100%"
      >
        <Flex>
          <LegacyStyledText
            fontSize={TYPOGRAPHY.fontSize28}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            lineHeight={TYPOGRAPHY.lineHeight36}
          >
            {props.headline}
          </LegacyStyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gap={SPACING.spacing4}
          overflowY={props.scroll === true ? 'auto' : undefined}
        >
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
