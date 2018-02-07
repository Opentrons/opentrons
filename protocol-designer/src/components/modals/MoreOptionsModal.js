import * as React from 'react'
import {
  FlatButton,
  PrimaryButton,
  FormGroup,
  InputField
} from '@opentrons/components'

import {formConnectorFactory} from '../../utils'
import styles from './MoreOptionsModal.css'

type Props = {
  onDelete: (event: SyntheticEvent<>) => void,
  onCancel: (event: SyntheticEvent<>) => void,
  onSave: (event: SyntheticEvent<>) => void,
  handleChange: (accessor: string) => (event: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => void,
  formData: {|
    'step-name': string,
    'step-details': string
  |} // TODO properly type the formData
}

export default function (props: Props) {
  const formConnector = formConnectorFactory(props.handleChange, props.formData)
  return (
    <div className={styles.modal_wrapper}>
      <FormGroup label='Step Name' className={styles.column_1_2}>
        <InputField {...formConnector('step-name')} />
      </FormGroup>
      <FormGroup label='Step Notes' className={styles.column_1_2}>
        {/* TODO: need textarea input in component library for big text boxes. */}
        <textarea className={styles.big_text_box} {...formConnector('step-details')} />
      </FormGroup>
      <div className={styles.button_row}>
        <PrimaryButton onClick={props.onDelete}>DELETE STEP</PrimaryButton> {/* TODO! */}
        <FlatButton onClick={props.onCancel}>CANCEL</FlatButton>
        <FlatButton onClick={props.onSave}>SAVE</FlatButton>
      </div>
    </div>
  )
}
