// @flow
import * as React from 'react'
import { Formik, Form, Field } from 'formik'
import { OutlineButton } from '@opentrons/components'
import TempField from './TempField'

import styles from './styles.css'

import type { SetTemperatureRequest } from '../../http-api-client'

type Props = {
  setTemp: (request: SetTemperatureRequest) => mixed,
}

export default class TemperatureControls extends React.Component<Props> {
  inputRef: { current: null | HTMLInputElement }
  constructor(props: Props) {
    super(props)
    this.inputRef = React.createRef()
  }

  deactivateModule = () => {
    const request = {
      command_type: 'deactivate',
    }
    this.props.setTemp(request)
  }
  render() {
    return (
      <Formik
        initialValues={{ target: '' }}
        onSubmit={(values, actions) => {
          const target = values.target === '' ? null : Number(values.target)
          if (!target) {
            return
          }
          const request = {
            command_type: 'set_temperature',
            args: [target],
          }
          this.props.setTemp(request)

          const $input = this.inputRef.current
          if ($input) $input.blur()

          actions.resetForm()
        }}
        render={formProps => {
          return (
            <Form className={styles.temperature_form}>
              <Field name="target" component={TempField} />
              <OutlineButton type="submit" className={styles.set_button}>
                Set target
              </OutlineButton>
              <OutlineButton
                className={styles.set_button}
                onClick={this.deactivateModule}
              >
                Deactivate
              </OutlineButton>
            </Form>
          )
        }}
      />
    )
  }
}
