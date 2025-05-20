import styled, { css } from 'styled-components'

import { CheckboxField } from '../../../atoms/CheckboxField'
import { InputField } from '../../../atoms/InputField'
import { BORDERS, COLORS } from '../../../helix-design-system'
import { borderRadius4 } from '../../../helix-design-system/borders'
import { blue10 } from '../../../helix-design-system/colors'
import { Flex } from '../../../primitives'
import { CURSOR_POINTER, DIRECTION_COLUMN } from '../../../styles'
import { SPACING } from '../../../ui-style-constants'
import {
  spacing4,
  spacing16,
  spacing20,
} from '../../../ui-style-constants/spacing'
import { StyledText } from '../../StyledText'

import type { ChangeEvent, ChangeEventHandler, MouseEvent } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { StyleProps } from '../../../primitives'

interface StackingProps {
  definition: LabwareDefinition2
  onCheckboxChange: (e: ChangeEvent<HTMLInputElement>) => void
  onInputFieldChange: () => void
  checked: boolean
}

interface CustomizeExpandButtonProps extends StyleProps {
  buttonText: string
  buttonValue: string | number
  onChange: ChangeEventHandler<HTMLInputElement>
  stackingProps?: StackingProps
  disabled?: boolean
  isSelected?: boolean
  id?: string
}

//  used for helix and as a child button to ListButtonAccordion
export function CustomizeExpandButton(
  props: CustomizeExpandButtonProps
): JSX.Element {
  const {
    buttonText,
    buttonValue,
    isSelected = false,
    onChange,
    disabled = false,
    id = buttonText,
    stackingProps,
  } = props

  return (
    <Flex
      width="100%"
      margin={SPACING.spacing4}
      onClick={(e: MouseEvent) => {
        e.stopPropagation()
      }}
    >
      <SettingButton
        checked={isSelected}
        id={id}
        disabled={disabled}
        onChange={onChange}
        type="radio"
        value={buttonValue}
      />
      <SettingButtonLabel
        role="label"
        isSelected={isSelected}
        disabled={disabled}
        htmlFor={id}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={spacing4}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {buttonText}
          </StyledText>
          {stackingProps != null ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              backgroundColor={blue10}
              padding={`${spacing16} ${spacing20}`}
              borderRadius={borderRadius4}
            >
              <CheckboxField
                onChange={stackingProps.onCheckboxChange}
                value={stackingProps.checked}
                label={`with ${stackingProps.definition.metadata.displayName}`}
              />
              {stackingProps.definition.stackLimit != null &&
              stackingProps.definition.stackLimit > 1 ? (
                <InputField
                  title="Labware quantity"
                  onChange={e => {
                    stackingProps.onInputFieldChange()
                    e.stopPropagation()
                  }}
                  caption={`Valid between 1-${stackingProps.definition.stackLimit}`}
                />
              ) : null}
            </Flex>
          ) : null}
        </Flex>
      </SettingButtonLabel>
    </Flex>
  )
}

const SettingButton = styled.input`
  display: none;
`

const AVAILABLE_BUTTON_STYLE = css`
  background: ${COLORS.white};
  color: ${COLORS.black90};

  &:hover {
    background-color: ${COLORS.grey10};
  }
`

const SELECTED_BUTTON_STYLE = css`
  background: ${COLORS.blue50};
  color: ${COLORS.white};

  &:active {
    background-color: ${COLORS.blue60};
  }
`

const DISABLED_STYLE = css`
  color: ${COLORS.grey40};
  background-color: ${COLORS.grey10};
`

interface ButtonLabelProps {
  isSelected: boolean
  disabled: boolean
}

const SettingButtonLabel = styled.label<ButtonLabelProps>`
  border-radius: ${BORDERS.borderRadius8};
  cursor: ${CURSOR_POINTER};
  padding: 14px ${SPACING.spacing12};
  width: 100%;

  ${({ isSelected }) =>
    isSelected ? SELECTED_BUTTON_STYLE : AVAILABLE_BUTTON_STYLE}
  ${({ disabled }) => disabled && DISABLED_STYLE}
`
