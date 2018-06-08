// @flow
import * as React from 'react'
import {FormGroup, InputField, InstrumentGroup, OutlineButton} from '@opentrons/components'
import type {FileMetadataFields} from '../file-data'
import type {FormConnector} from '../utils'
import styles from './FilePage.css'
import formStyles from '../components/forms.css'

type Props = {
  formConnector: FormConnector<FileMetadataFields>,
  isFormAltered: boolean,
  instruments: React.ElementProps<typeof InstrumentGroup>,
  saveFileMetadata: () => void
}

const FilePage = ({formConnector, isFormAltered, instruments, saveFileMetadata}: Props) => (
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
      <div className={styles.button_row}>
        <OutlineButton className={styles.update_button} onClick={saveFileMetadata} disabled={!isFormAltered}>
          UPDATE
        </OutlineButton>
      </div>
    </section>

    <section>
      <h2>
        Pipettes
      </h2>
      <InstrumentGroup {...instruments} showMountLabel />
    </section>
  </div>
)

export default FilePage
