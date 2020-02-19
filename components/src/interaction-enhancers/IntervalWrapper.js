// @flow
// TODO(mc, 2020-02-18): delete this component once last usage is removed in
// app/src/components/RobotSettings/SelectNetwork/index.js
import * as React from 'react'

export type IntervalWrapperProps = {|
  /** Function/Action to call at an interval */
  refresh: () => mixed,
  /** Interval in milliseconds to call refresh */
  interval: number,
  /** Component to wrap in interval */
  children: React.Node,
|}

type IntervalWrapperState = {|
  intervalId: ?IntervalID,
|}

export class IntervalWrapper extends React.Component<
  IntervalWrapperProps,
  IntervalWrapperState
> {
  constructor(props: IntervalWrapperProps) {
    super(props)
    this.state = {
      intervalId: null,
    }
  }

  render() {
    const { children } = this.props

    return <React.Fragment>{children}</React.Fragment>
  }

  componentDidMount() {
    const { refresh, interval } = this.props
    const intervalId = setInterval(refresh, interval)
    this.setState({ intervalId: intervalId })
    refresh()
  }

  componentWillUnmount() {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
  }
}
