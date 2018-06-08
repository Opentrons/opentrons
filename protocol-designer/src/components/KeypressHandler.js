// @flow
import * as React from 'react'
import _ from 'lodash'

const KEY_CODES = {
  enter: 13,
  up_arrow: 38,
  down_arrow: 40
}

const KEY_CODE_NAMES = _.invert(KEY_CODES)

type KeyHandlers = { [$Keys<KEY_CODES>]: () => void };

type RenderParams = {
  onKeyDown: (SyntheticKeyboardEvent<HTMLInputElement>) => void
}

type Props = {
  keyHandlers: KeyHandlers,
  render: (RenderParams) => React.Node,
}

const makeHandler = (keyHandlers: KeyHandlers) => (event: SyntheticKeyboardEvent<HTMLInputElement>) => {
  const keyCode = event.keyCode
  const handler = keyHandlers[KEY_CODE_NAMES[keyCode]]

  if (handler) {
    event.preventDefault()
    handler(event)
  }
}

const KeypressHandler = ({ keyHandlers, render }: Props) => {
  const WithKeypressHandling = render({ onKeyDown: makeHandler(keyHandlers) })

  return WithKeypressHandling
}

export default KeypressHandler
