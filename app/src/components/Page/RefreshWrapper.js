// @flow
import * as React from 'react'

type Props = {
  refresh: () => mixed,
  children: React.Node,
}
export default class RefreshWrapper extends React.Component<Props> {
  render () {
    const {children} = this.props

    return (
      <React.Fragment>
        {children}
      </React.Fragment>
    )
  }
  componentDidMount () {
    this.props.refresh()
  }
}
