// @flow
import * as React from 'react'

type Props = {
  watch?: string,
  refreshing?: boolean,
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

  componentDidUpdate (prevProps: Props) {
    if (prevProps.watch !== this.props.watch) {
      this.props.refresh()
    }
  }
}
