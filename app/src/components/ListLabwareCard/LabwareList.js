// @flow
import * as React from 'react'

import type { CheckedLabwareFile } from '../../custom-labware/types'
import { LabwareItem } from './LabwareItem'
import styles from './styles.css'
import { Warning } from './Warning'

// TODO(mc, 2019-10-22): i18n
const CATEGORY = 'Category'
const LABWARE = 'Labware'
const DATE_ADDED = 'Date Added'

const UNABLE_TO_READ_CUSTOM_LABWARE =
  'Unable to read Custom Labware source folder.'

const PLEASE_ENSURE_CORRECT_FOLDER =
  'Please ensure you are able to access the folder selected in Labware Management above.'

const NO_LABWARE_DEFINITIONS_FOUND = 'No labware definitions found'

const PLEASE_ADD_CUSTOM_LABWARE =
  'Please add custom labware via the Labware Management options above'

export type LabwareListProps = {|
  labware: Array<CheckedLabwareFile>,
  errorMessage: string | null,
|}

export function LabwareList(props: LabwareListProps): React.Node {
  const { labware, errorMessage } = props
  let children = null

  if (errorMessage !== null) {
    children = (
      <div className={styles.message_wrapper}>
        <Warning>
          <p>
            {UNABLE_TO_READ_CUSTOM_LABWARE}
            <br />
            {PLEASE_ENSURE_CORRECT_FOLDER}
          </p>
          <p className={styles.error_message}>{errorMessage}</p>
        </Warning>
      </div>
    )
  } else if (labware.length === 0) {
    children = (
      <div className={styles.message_wrapper}>
        <p className={styles.italic}>
          {NO_LABWARE_DEFINITIONS_FOUND}
          <br />
          {PLEASE_ADD_CUSTOM_LABWARE}
        </p>
      </div>
    )
  } else {
    children = (
      <>
        <div className={styles.list_column_titles}>
          <p className={styles.item_category_column}>{CATEGORY}</p>
          <p className={styles.item_name_column}>{LABWARE}</p>
          <p className={styles.item_date_column}>{DATE_ADDED}</p>
        </div>
        <ul className={styles.unstyled_list}>
          {labware.map(lwFile => (
            <LabwareItem key={lwFile.filename} file={lwFile} />
          ))}
        </ul>
      </>
    )
  }

  return <div className={styles.labware_list_wrapper}>{children}</div>
}
