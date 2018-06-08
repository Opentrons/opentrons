// @flow
import * as React from 'react'
import {
  FormGroup,
  InputField,
  InstrumentGroup,
  OutlineButton,
  KeypressHandler
} from '@opentrons/components'
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
      <KeypressHandler
        keyHandlers={{enter: saveFileMetadata}}
        render={({onKeyDown}) => (
          <React.Fragment>
            <div className={formStyles.row_wrapper}>
              <FormGroup label='Protocol Name:' className={formStyles.column_1_2}>
                <InputField onKeyDown={onKeyDown} placeholder='Untitled' {...formConnector('name')} />
              </FormGroup>

              <FormGroup label='Organization/Author:' className={formStyles.column_1_2}>
                <InputField onKeyDown={onKeyDown} {...formConnector('author')} />
              </FormGroup>
            </div>

            <FormGroup label='Description:'>
              <InputField onKeyDown={onKeyDown} {...formConnector('description')}/>
            </FormGroup>
          </React.Fragment>
        )} />
      <div className={styles.button_row}>
        <OutlineButton type="submit" className={styles.update_button} onClick={saveFileMetadata} disabled={!isFormAltered}>
          {isFormAltered ? 'UPDATE' : 'SAVED'}
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
