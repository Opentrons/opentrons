// @flow
import * as React from 'react'

type Props = {
  render: ({
    selected: ?string,
    select: (?string) => mixed
  }) => React.Node
}
type State = {selected: ?string}

/** Keeps track of one selected string identifier in state */
export default class SelectedWrapper extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {selected: null}
  }

  select = (selected: ?string) => {
    this.setState({selected})
  }

  render () {
    const {render} = this.props
    const {selected} = this.state
    return render({selected, select: this.select})
  }
}
