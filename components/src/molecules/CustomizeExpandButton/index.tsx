import { memo } from 'react'
import styled, { css } from 'styled-components'

import { CheckboxField } from '../../atoms/CheckboxField'
import { StyledText } from '../../atoms/StyledText'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { CURSOR_POINTER, DIRECTION_COLUMN } from '../../styles'
import { SPACING } from '../../ui-style-constants'
import { InputField } from '..//InputField'

import type {
  ChangeEvent,
  ChangeEventHandler,
  MemoExoticComponent,
  MouseEvent,
  ReactNode,
} from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { StyleProps } from '../../primitives'

export interface StackingProps {
  onInputFieldChange: (e: ChangeEvent<HTMLInputElement>) => void
  inputFieldValue: number
  inputTitle: string
  errorMessage: string
  inputCaption: string
  definition: LabwareDefinition2
  onCheckboxChange?: () => void
  checked?: boolean
  checkboxCaption?: string
}

interface CustomizeExpandButtonProps extends StyleProps {
  allowInputField: boolean
  isNestedDefALid: boolean
  buttonText: string
  buttonValue: string | number
  onChange: ChangeEventHandler<HTMLInputElement>
  //  used for the hopper stack limit so far
  customStackLimit?: number
  stackingProps?: StackingProps
  disabled?: boolean
  isSelected?: boolean
  id?: string
}

//  used for helix and as a child button to ListButtonAccordion
export function CustomizeExpandButtonComponent(
  props: CustomizeExpandButtonProps
): ReactNode {
  const {
    buttonText,
    buttonValue,
    isSelected = false,
    onChange,
    disabled = false,
    id = buttonText,
    stackingProps,
    allowInputField,
    isNestedDefALid,
    customStackLimit,
  } = props
  const isLid =
    stackingProps != null &&
    stackingProps.definition.allowedRoles?.includes('lid')

  const limit = customStackLimit ?? stackingProps?.definition.stackLimit

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
        onChange={e => {
          onChange(e)
          e.stopPropagation()
        }}
        type="radio"
        value={buttonValue}
      />
      <SettingButtonLabel
        role="label"
        isSelected={isSelected}
        disabled={disabled}
        htmlFor={id}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {buttonText}
          </StyledText>
          {stackingProps != null && isSelected ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              backgroundColor={COLORS.blue10}
              padding={SPACING.spacing16}
              borderRadius={BORDERS.borderRadius4}
              gridGap={SPACING.spacing8}
            >
              {isLid &&
              !isNestedDefALid &&
              stackingProps.onCheckboxChange != null ? (
                <CheckboxField
                  onChange={e => {
                    e.stopPropagation()
                    e.preventDefault()
                    stackingProps.onCheckboxChange?.()
                  }}
                  value={stackingProps.checked}
                  label={stackingProps.checkboxCaption}
                  padding={`0 0 0 ${SPACING.spacing8}`}
                />
              ) : null}
              {limit != null && limit > 1 && allowInputField ? (
                <InputField
                  id="CustomizeExpandButton_inputField"
                  testId="customize-expand-button-input-field"
                  title={stackingProps.inputTitle}
                  onChange={e => {
                    e.stopPropagation()
                    stackingProps.onInputFieldChange(e)
                  }}
                  type="number"
                  error={
                    !stackingProps.inputFieldValue ||
                    stackingProps.inputFieldValue > limit
                      ? stackingProps.errorMessage
                      : null
                  }
                  value={stackingProps.inputFieldValue}
                  caption={stackingProps.inputCaption}
                />
              ) : null}
            </Flex>
          ) : null}
        </Flex>
      </SettingButtonLabel>
    </Flex>
  )
}

export const CustomizeExpandButton: MemoExoticComponent<
  typeof CustomizeExpandButtonComponent
> = memo(CustomizeExpandButtonComponent)

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
  padding: ${SPACING.spacing12};
  width: 100%;

  ${({ isSelected }) =>
    isSelected ? SELECTED_BUTTON_STYLE : AVAILABLE_BUTTON_STYLE}
  ${({ disabled }) => disabled && DISABLED_STYLE}
`
