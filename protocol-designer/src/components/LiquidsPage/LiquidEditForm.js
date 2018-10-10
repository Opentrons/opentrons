// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {
  Card,
  CheckboxField,
  FormGroup,
  InputField,
  OutlineButton,
  PrimaryButton,
} from '@opentrons/components'
import styles from './LiquidEditForm.css'
import formStyles from '../forms.css'

type Props = {
  // TODO
}

// TODO IMMEDIATELY: internationalization of copy
class LiquidEditForm extends React.Component<Props> {
  render () {
    return (
      <Card className={styles.form_card}>
        <section className={styles.section}>
          <div className={formStyles.header}>Details</div>
          <div className={formStyles.row_wrapper}>
            <FormGroup label='Liquid name:' className={formStyles.column_1_2}>
              <InputField />
            </FormGroup>
            <FormGroup label='Description:' className={formStyles.column_1_2}>
              <InputField />
            </FormGroup>
          </div>
        </section>

        <section className={styles.section}>
          <div className={formStyles.header}>Serialization</div>
          <p className={styles.info_text}>{'Each placement of the liquid will get its own number. ("Sample 1", "Sample 2", "Sample 3")'}</p>
          <CheckboxField label='Serialize' onChange={() => console.log('TODO IMMEDIATELY')} />
        </section>

        <div className={styles.button_row}>
          <OutlineButton>DELETE</OutlineButton>
          <PrimaryButton>CANCEL</PrimaryButton>
          <PrimaryButton>SAVE</PrimaryButton>
        </div>
      </Card>
    )
  }
}

export default connect()(LiquidEditForm)
