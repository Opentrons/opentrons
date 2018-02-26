// @flow
import React from 'react'
import {FormGroup, InputField} from '@opentrons/components'
import type {FilePageFields, FieldConnector} from '../file-data'

import styles from './FilePage.css'
import formStyles from '../components/Form.css'

type Props = {
  fieldConnector: FieldConnector<FilePageFields>
}

export default function FilePage (props: Props) {
  return (
    <div className={styles.file_page}>
      <section>
        <h1>
          Information
        </h1>

        <div className={formStyles.row_wrapper}>
          <FormGroup label='Protocol Name:' className={formStyles.column_1_2}>
            <InputField placeholder='Untitled' {...props.fieldConnector('name')} />
          </FormGroup>

          <FormGroup label='Organization/Author:' className={formStyles.column_1_2}>
            <InputField {...props.fieldConnector('author')} />
          </FormGroup>
        </div>

        <FormGroup label='Description:'>
          <InputField {...props.fieldConnector('description')}/>
        </FormGroup>
      </section>

      <section>
        <h1>
          Pipettes
        </h1>
      </section>
    </div>
  )
}
