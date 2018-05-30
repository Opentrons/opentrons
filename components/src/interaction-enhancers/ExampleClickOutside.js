// @flow
import * as React from 'react'
import clickOutside from './clickOutside'
import type {ClickOutsideInterface} from './clickOutside'

type InnerProps = {counter: number} & ClickOutsideInterface

function WrapMe (props: InnerProps) {
  return (
    <div ref={props.passRef}>
      <p>Click outside of this!</p>
      <em>Outside click count is {props.counter}</em>
      <p>Clicking anywhere inside here does not increment the counter</p>
    </div>
  )
}

class WrapMeClass extends React.Component<InnerProps> {
  render () {
    const {passRef, counter} = this.props
    return (
      <div ref={passRef}>
        Clicked outside {counter} times
      </div>
    )
  }
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
type State = {counter1: number, counter2: number}

// NOTE: this is just for react-styleguidist static documentation generator
export default class ExampleClickOutside extends React.Component<Props, State> {
  Example: *
  ClassExample: *
  onClickOutside1: () => void
  onClickOutside2: () => void

  constructor (props: Props) {
    super(props)

    this.state = {counter1: 0, counter2: 0}

    this.onClickOutside1 = () => {
      this.setState({counter1: this.state.counter1 + 1})
    }

    this.onClickOutside2 = () => {
      this.setState({counter2: this.state.counter2 + 1})
    }

    this.Example = clickOutside(WrapMe)
    this.ClassExample = clickOutside(WrapMeClass)
  }

  render () {
    // const BadExample = clickOutside(BadWrapMe)
    const Example = this.Example
    const ClassExample = this.ClassExample

    return (
      <div>
        <strong>Functional Component Example</strong>
        <Example counter={this.state.counter1} onClickOutside={this.onClickOutside1} />

        <hr />

        <strong>Class Component Example</strong>
        <ClassExample counter={this.state.counter2} onClickOutside={this.onClickOutside2} />
        {/* <BadExample counter={this.state.counter} onClickOutside={this.onClickOutside} /> */}
      </div>
    )
  }
}
