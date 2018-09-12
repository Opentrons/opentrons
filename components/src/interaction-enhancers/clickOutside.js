// @flow
import * as React from 'react'

type WrapperRefType = ?Element

export type ClickOutsideInterface = {
  passRef: WrapperRefType => mixed,
}

type HocProps = {
  onClickOutside: ?(MouseEvent => mixed),
}

export default function clickOutside<
  WrappedProps: ClickOutsideInterface,
  InnerProps: $Diff<WrappedProps, ClickOutsideInterface>,
  Props: InnerProps & HocProps
> (WrappedComponent: React.ComponentType<WrappedProps>): React.ComponentType<Props> {
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
        this.props.onClickOutside &&
        this.wrapperRef &&
        !this.wrapperRef.contains(clickedElem)
      ) {
        this.props.onClickOutside(event)
      }
    }

    componentDidMount () {
      document.addEventListener('mousedown', this.handleClickOutside)
    }

    componentWillUnmount () {
      document.removeEventListener('mousedown', this.handleClickOutside)
    }

    render () {
      const {onClickOutside, ...passedProps} = this.props
      return <WrappedComponent {...passedProps} passRef={this.setWrapperRef} />
    }
  }
}

// TODO: BC 2018-7-25 deprecate HOC version (clickOutside) and move to just ClickOutside FOC
type ClickOutsideProps = {
  onClickOutside: ?(MouseEvent => mixed),
  children: ({ref: React.Ref<*>}) => React.Element<*>,
}
export class ClickOutside extends React.Component<ClickOutsideProps> {
  wrapperRef: ?Element

  constructor (props: ClickOutsideProps) {
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
