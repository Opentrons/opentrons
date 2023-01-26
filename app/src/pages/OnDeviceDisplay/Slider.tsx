import * as React from 'react'
import { css } from 'styled-components'

import { Flex } from '@opentrons/components'

import { useInteractJS } from './hooks'

const SLIDER_STYLE = css`
  position: relative;
  width: 100%;
  height: 1em;
  margin: 1.5em auto;
  background-color: #29e;
  border-radius: 0.5em;
  box-sizing: border-box;

  font-size: 1em;

  -ms-touch-action: none;
  touch-action: none;

  &:before {
    content: '';
    display: block;
    position: relative;
    top: -1.5em;

    width: 4em;
    height: 4em;
    margin-left: -1em;
    border: solid 0.25em #fff;
    border-radius: 1em;
    background-color: inherit;

    box-sizing: border-box;
  }

  &:after {
    content: attr(data-value);
    position: absolute;
    top: -1.5em;
    width: 2em;
    line-height: 1em;
    margin-left: -1em;
    text-align: center;
  }
`

export function Slider(): JSX.Element {
  const interact = useInteractJS()
  return (
    // <Flex width="40rem" flexDirection={DIRECTION_COLUMN} padding="2.5rem">
    <Flex justifyContent="center" alignItems="center">
      <div css={SLIDER_STYLE} ref={interact.ref}></div>
      {/* </Flex> */}
    </Flex>
  )
}
