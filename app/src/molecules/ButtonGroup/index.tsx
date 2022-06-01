import * as React from 'react'
import { css } from 'styled-components'
import { BORDERS, COLORS, Flex } from '@opentrons/components'
import {
  blue,
  lightGrey,
  medGrey,
} from '@opentrons/components/src/ui-style-constants/colors'

interface ButtonGroupProps {
  children: React.ReactNode
}

const BUTTON_GROUP_STYLES = css`
  border: 1px ${medGrey} solid;
  border-radius: ${BORDERS.radiusSoftCorners};
  margin-top: -1px;

  button {
    height: 28px;
    width: auto;
    border: none;
    background-color: inherit;
    color: ${COLORS.black};
    font-weight: 400;
    font-size: 11px;
    line-height: 14px;
    box-shadow: none;

    &:focus {
      box-shadow: none;
      color: ${COLORS.white};
    }

    &:hover {
      background-color: ${lightGrey};
      box-shadow: 0 0 0;
    }

    &:active {
      background-color: ${blue};
      color: ${COLORS.white};
    }

    &:disabled {
      background-color: inherit;
      color: ${COLORS.disabled};
    }
  }

  button:first-child {
    border-radius: ${BORDERS.radiusSoftCorners} 0 0 ${BORDERS.radiusSoftCorners};
  }

  button:last-child {
    border-radius: 0 ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} 0;
  }
`

export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  return <Flex css={BUTTON_GROUP_STYLES}>{props.children}</Flex>
}
