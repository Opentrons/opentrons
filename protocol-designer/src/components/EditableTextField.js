// @flow
// TODO: Ian 2018-10-30 if we like this, add it to components library
import * as React from 'react'
import { ClickOutside, Icon, InputField } from '@opentrons/components'
import styles from './editableTextField.css'

type Props = {
  className?: string,
  value: ?string,
  saveEdit: (newValue: string) => mixed,
}

type State = {
  editing: boolean,
  transientValue: ?string,
}

export class EditableTextField extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      editing: false,
      transientValue: this.props.value,
    }
  }

  enterEditMode = () =>
    this.setState({ editing: true, transientValue: this.props.value })

  handleCancel = () => {
    this.setState({
      editing: false,
      transientValue: this.props.value,
    })
  }

  handleKeyUp = (e: SyntheticKeyboardEvent<*>) => {
    if (e.key === 'Escape') {
      this.handleCancel()
    }
  }

  handleFormSubmit = (e: SyntheticEvent<*>) => {
    e.preventDefault() // avoid 'form is not connected' warning
    this.handleSubmit()
  }

  handleSubmit = () => {
    this.setState({ editing: false }, () =>
      this.props.saveEdit(this.state.transientValue || '')
    )
  }

  updateValue = (e: SyntheticInputEvent<*>) => {
    this.setState({ transientValue: e.currentTarget.value })
  }

  render() {
    const { className, value } = this.props
    if (this.state.editing) {
      return (
        <ClickOutside onClickOutside={this.handleSubmit}>
          {({ ref }) => (
            <form
              className={className}
              onKeyUp={this.handleKeyUp}
              onSubmit={this.handleFormSubmit}
              ref={ref}
            >
              <InputField
                autoFocus
                value={this.state.transientValue}
                onChange={this.updateValue}
                units={<Icon name="pencil" className={styles.edit_icon} />}
              />
            </form>
          )}
        </ClickOutside>
      )
    }

    return (
      <div onClick={this.enterEditMode} className={className}>
        <div className={styles.static_value}>{value}</div>
        <Icon name="pencil" className={styles.edit_icon_right} />
      </div>
    )
  }
}
