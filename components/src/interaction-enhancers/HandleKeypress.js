// @flow
import * as React from 'react'

type KeypressEvent = SyntheticKeyboardEvent<HTMLElement>

export type KeypressHandler = {|
  key: string,
  shiftKey?: ?boolean,
  onPress: () => mixed,
|}

export type HandleKeypressProps = {|
  /** array of keypress handlers to attach to the window */
  handlers: Array<KeypressHandler>,
  /** optionally call event.preventDefault if keypress is handled */
  preventDefault?: ?boolean,
  /** wrapped children */
  children?: React.Node,
|}

const matchHandler = e => h =>
  h.key === e.key && (h.shiftKey == null || h.shiftKey === e.shiftKey)

/**
 * Keypress handler wrapper component. Takes an array of keypress handlers
 * to call when a given key is pressed on the keyboard. Handler is called on
 * `keyup` event. `event.preventDefault` will be called if a key is handled
 * and `props.preventDefault` is true.
 */
export class HandleKeypress extends React.Component<HandleKeypressProps> {
  handlePressIfKey = (event: KeypressEvent) => {
    this.props.handlers.filter(matchHandler(event)).forEach(h => h.onPress())
  }

  preventDefaultIfKey = (event: KeypressEvent) => {
    if (!this.props.preventDefault) return

    const pressHandled = this.props.handlers.some(matchHandler(event))

    if (pressHandled) event.preventDefault()
  }

  componentDidMount() {
    window.addEventListener('keyup', this.handlePressIfKey)
    window.addEventListener('keyup', this.preventDefaultIfKey)
    window.addEventListener('keydown', this.preventDefaultIfKey)
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handlePressIfKey)
    window.removeEventListener('keyup', this.preventDefaultIfKey)
    window.removeEventListener('keydown', this.preventDefaultIfKey)
  }

  render() {
    return <>{this.props.children}</>
  }
}
