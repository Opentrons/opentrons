// @flow
import * as React from 'react'
import clickOutside from './clickOutside'
import type {ClickOutsideInterface} from './clickOutside'

type InnerProps = {counter: number} & ClickOutsideInterface

function WrapMe (props: InnerProps) {
  return (
    <div ref={props.passRef}>
      <p>Click outside of this!</p>
      <strong>Outside click count is {props.counter}</strong>
      <p>Clicking anywhere inside here does not increment the counter</p>
    </div>
  )
}

// NOTE: this `BadWrapMe` ensures that flow types on clickOutside work as expected
// TODO Ian 2018-05-25 write flow-typed tests for this???

// type BadInnerProps = {counter: number} // NO ClickOutsideInterface
//
// function BadWrapMe (props: BadInnerProps) {
//   return (
//     <div>
//       <p>Click outside of this!</p>
//       <strong>Outside click count is {props.counter}</strong>
//       <p>Clicking anywhere inside here does not increment the counter</p>
//     </div>
//   )
// }

type Props = {}
type State = {counter: number}

// NOTE: this is just for react-styleguidist static documentation generator
export default class ExampleClickOutside extends React.Component<Props, State> {
  Example: *
  onClickOutside: () => void

  constructor (props: Props) {
    super(props)

    this.state = {counter: 0}

    this.onClickOutside = () => {
      this.setState({counter: this.state.counter + 1})
    }

    this.Example = clickOutside(WrapMe, this.onClickOutside)
  }

  render () {
    // const BadExample = clickOutside(BadWrapMe, this.onClickOutside)
    const Example = this.Example

    return (
      <div>
        <Example counter={this.state.counter} />
        {/* <BadExample counter={this.state.counter} /> */}
      </div>
    )
  }
}
