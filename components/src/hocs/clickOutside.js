// @flow
import * as React from 'react'

type WrapperRefType = ?Element

export type ClickOutsideInterface = {
  passRef: WrapperRefType => mixed
}

export default function clickOutside<
  WrappedProps: ClickOutsideInterface,
  Props: $Diff<WrappedProps, ClickOutsideInterface>
> (
  WrappedComponent: React.ComponentType<WrappedProps>,
  onClickOutside: ?(MouseEvent => mixed)
): React.ComponentType<Props> {
  return class ClickOutsideWrapper extends React.Component<Props> {
    wrapperRef: WrapperRefType

    constructor (props: Props) {
      super(props)
      this.wrapperRef = null
    }

    setWrapperRef = (element: WrapperRefType) => {
      this.wrapperRef = element
    }

    handleClickOutside = (event: MouseEvent) => {
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
      return <WrappedComponent {...this.props} passRef={this.setWrapperRef} />
    }
  }
}
