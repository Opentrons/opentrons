// @flow
import * as React from 'react'

type Props = {
  /** Function/Action to call at an interval */
  refresh: () => mixed,
  /** Interval in milliseconds to call refresh */
  interval: number,
  /** Component to wrap in interval */
  children: React.Node,
}

type State = {
  intervalId: ?IntervalID,
}

export default class IntervalWrapper extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      intervalId: null,
    }
  }

  render () {
    const {children} = this.props

    return <React.Fragment>{children}</React.Fragment>
  }

  componentDidMount () {
    const {refresh, interval} = this.props
    const intervalId = setInterval(refresh, interval)
    this.setState({intervalId: intervalId})
    refresh()
  }

  componentWillUnmount () {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
  }
}
