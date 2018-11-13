// @flow
import * as React from 'react'

type Props = {
  onClickOutside: ?(MouseEvent => mixed),
  children: ({ref: React.Ref<*>}) => React.Element<*>,
}

export default class ClickOutside extends React.Component<Props> {
  wrapperRef: ?Element

  constructor (props: Props) {
    super(props)
    this.wrapperRef = null
  }

  componentDidMount () {
    document.addEventListener('mousedown', this.handleClickOutside)
  }
  componentWillUnmount () {
    document.removeEventListener('mousedown', this.handleClickOutside)
  }
  setWrapperRef = (el: ?Element) => { this.wrapperRef = el }

  handleClickOutside = (event: MouseEvent) => {
    const clickedElem = event.target

    if (!(clickedElem instanceof Node)) {
      // NOTE: this is some flow type checking funkiness
      // TODO Ian 2018-05-24 use assert.
      console.warn('expected clicked element to be Node - something went wrong in ClickOutside')
      return
    }

    if (
      this.props.onClickOutside &&
      this.wrapperRef &&
      !this.wrapperRef.contains(clickedElem)
    ) {
      this.props.onClickOutside(event)
    }
  }

  render () {
    return this.props.children({ref: this.setWrapperRef})
  }
}
