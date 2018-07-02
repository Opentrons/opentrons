// @flow
import * as React from 'react'
import {
  FormGroup,
  InputField,
  InstrumentGroup,
  OutlineButton
} from '@opentrons/components'
import type {FileMetadataFields} from '../file-data'
import type {FormConnector} from '../utils'
import styles from './FilePage.css'
import formStyles from '../components/forms.css'

export type FilePageProps = {
  formConnector: FormConnector<FileMetadataFields>,
  isFormAltered: boolean,
  instruments: React.ElementProps<typeof InstrumentGroup>,
  saveFileMetadata: () => void
}

const FilePage = ({formConnector, isFormAltered, instruments, saveFileMetadata}: FilePageProps) => {
  const handleSubmit = (e: SyntheticEvent<*>) => {
    // blur focused field on submit
    if (document && document.activeElement) document.activeElement.blur()
    saveFileMetadata()
    e.preventDefault()
  }
  return (
    <div className={styles.file_page}>
      <section>
        <h2>
          Information
        </h2>
        <form onSubmit={handleSubmit}>
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
            <OutlineButton type="submit" className={styles.update_button} disabled={!isFormAltered}>
              {isFormAltered ? 'UPDATE' : 'UPDATED'}
            </OutlineButton>
          </div>
        </form>
      </section>

      <section>
        <h2>
          Pipettes
        </h2>
        <InstrumentGroup {...instruments} showMountLabel />
      </section>
    </div>
  )
}

export default FilePage
