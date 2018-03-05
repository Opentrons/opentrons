// @flow
import React from 'react'
import {FormGroup, InputField} from '@opentrons/components'
import type {FilePageFields} from '../file-data'
import type {FormConnector} from '../utils'

import styles from './FilePage.css'
import formStyles from '../components/Form.css'

type Props = {
  formConnector: FormConnector<FilePageFields>
}

export default function FilePage (props: Props) {
  const {formConnector} = props
  return (
    <div className={styles.file_page}>
      <section>
        <h1>
          Information
        </h1>

        <div className={formStyles.row_wrapper}>
          <FormGroup label='Protocol Name:' className={formStyles.column_1_2}>
            <InputField placeholder='Untitled' {...formConnector('name')} />
          </FormGroup>

          <FormGroup label='Organization/Author:' className={formStyles.column_1_2}>
            <InputField {...formConnector('author')} />
          </FormGroup>
        </div>

        <FormGroup label='Description:'>
          <InputField {...formConnector('description')}/>
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
