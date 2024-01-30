import * as React from 'react'
import { css } from 'styled-components'
import { UseFormRegister } from 'react-hook-form'
import {
  ALIGN_CENTER,
  BORDERS,
  COLOR_WARNING_DARK,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import type { FormState } from './types'

export interface InputFieldProps {
  register: UseFormRegister<FormState>
  fieldName: 'name' | 'organizationOrAuthor'
  /** optional ID of <input> element */
  id?: string
  /** if included, InputField will use error style and display error instead of caption */
  error?: string | null
  autoFocus?: boolean
}

export function InputField(props: InputFieldProps): JSX.Element {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      lineHeight={1}
      fontSize={TYPOGRAPHY.fontSizeP}
      fontWeight={TYPOGRAPHY.fontWeightRegular}
      color={props.error != null ? COLOR_WARNING_DARK : COLORS.black90}
    >
      <Input {...props} />
    </Flex>
  )
}

// TODO(BC, 2023-06-16): reconcile this with the components library component that it was copied from
function Input(props: InputFieldProps): JSX.Element {
  const error = props.error != null

  const INPUT_FIELD = css`
    display: flex;
    background-color: ${COLORS.white};
    border-radius: ${SPACING.spacing4};
    padding: ${SPACING.spacing8};
    border: 1px ${BORDERS.styleSolid} ${error ? COLORS.red50 : COLORS.grey30};
    font-size: ${TYPOGRAPHY.fontSizeP};

    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      padding: 0;
    }

    &:active {
      border: 1px ${BORDERS.styleSolid} ${COLORS.grey50};
    }

    & input {
      border-radius: inherit;
      color: ${COLORS.black90};
      border: none;
      flex: 1 1 auto;
      width: 100%;
      height: ${SPACING.spacing16};
    }
    & input:focus {
      outline: none;
    }

    &:hover {
      border: 1px ${BORDERS.styleSolid} ${error ? COLORS.red50 : COLORS.grey60};
    }
    &:focus {
      border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};
    }
    &:disabled {
      border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};
    }
    input[type='number']::-webkit-inner-spin-button,
    input[type='number']::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `

  return (
    <Flex width="100%" flexDirection={DIRECTION_COLUMN}>
      <Flex css={INPUT_FIELD}>
        <input
          data-testid={props.id}
          autoFocus={props.autoFocus}
          {...props.register(`fields.${props.fieldName}`)}
        />
      </Flex>
    </Flex>
  )
}
