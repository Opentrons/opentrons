// @flow
import * as React from 'react'

type Props = {
  /** callback when user clicks outside */
  onClickOutside: ?(MouseEvent => mixed),
  /** childen wrapped by ClickOutside wrapper */
  children?: React.Node,
  /** string for element to wrap children in. Defaults to 'div' */
  wrapperElement?: $Keys<$JSXIntrinsics>
}

type WrapperRefType = ?Element

export default class ClickOutside extends React.Component<Props> {
  wrapperRef: WrapperRefType

  constructor (props: Props) {
    super(props)
    this.wrapperRef = null
  }

  setWrapperRef = (element: WrapperRefType) => {
    this.wrapperRef = element
  }

  handleClickOutside = (event: MouseEvent) => {
    const {onClickOutside} = this.props
    const clickedElem = event.target

    if (!(clickedElem instanceof Node)) {
      // NOTE: this is some flow type checking funkiness
      // TODO Ian 2018-05-24 use assert.
      console.warn('expected clicked element to be Node - something went wrong in ClickOutside')
      return
    }

    if (
      onClickOutside &&
      this.wrapperRef &&
      !this.wrapperRef.contains(clickedElem)
    ) {
      onClickOutside(event)
    }
  }

  componentDidMount () {
    document.addEventListener('mousedown', this.handleClickOutside)
  }

  componentWillUnmount () {
    document.removeEventListener('mousedown', this.handleClickOutside)
  }

  render () {
    const Wrapper = this.props.wrapperElement || 'div'
    return (
      <Wrapper ref={ref => this.setWrapperRef(ref)}>
        {this.props.children}
      </Wrapper>
    )
  }
}
