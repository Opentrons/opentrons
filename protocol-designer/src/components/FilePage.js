// @flow
import React from 'react'
import {FormGroup, InputField, InstrumentGroup, type InstrumentInfoProps} from '@opentrons/components'
import type {FilePageFields} from '../file-data'
import type {FormConnector} from '../utils'

import styles from './FilePage.css'
import formStyles from '../components/Form.css'

type Props = {
  formConnector: FormConnector<FilePageFields>,
  instruments: Array<InstrumentInfoProps>
}

export default function FilePage (props: Props) {
  const {formConnector, instruments} = props
  return (
    <div className={styles.file_page}>
      <section>
        <h2>
          Information
        </h2>

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
        <h2>
          Pipettes
        </h2>
        <InstrumentGroup instruments={instruments} />
      </section>
    </div>
  )
}
