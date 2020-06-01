// @flow
import * as React from 'react'
import cx from 'classnames'
import startCase from 'lodash/startCase'
import { basename } from 'path'
import { format } from 'date-fns'

import {
  INVALID_LABWARE_FILE,
  DUPLICATE_LABWARE_FILE,
  OPENTRONS_LABWARE_FILE,
} from '../../custom-labware'

import { Warning } from './Warning'
import styles from './styles.css'

import type { CheckedLabwareFile } from '../../custom-labware/types'

// TODO(mc, 2019-11-21): i18n
const NA = 'N/A'
const FILE_NAME = 'File Name'
const API_NAME = 'API Name'

const THIS_FILE_IS_NOT_A_VALID_DEFINITION =
  'This file is not a valid Opentrons labware definition or cannot be read. Please check the file.'

const THIS_FILE_CONFLICTS_WITH_ANOTHER_DEFINITION =
  'This file conflicts with another labware definition that is already in this folder. Please check the API name.'

const THIS_FILE_CONFLICTS_WITH_AN_OPENTRONS_DEFINITION =
  'This file conflicts with an Opentrons standard labware definition. If you are trying to create a definition based on an Opentrons definition, please contact support'

export type LabwareItemProps = {|
  file: CheckedLabwareFile,
|}

export function LabwareItem(props: LabwareItemProps): React.Node {
  const { file } = props
  const { type, filename, created, definition = null } = file
  const apiName = definition?.parameters.loadName || NA
  const displayName = definition?.metadata.displayName || NA
  const displayCategory = definition
    ? startCase(definition.metadata.displayCategory)
    : NA

  let warning = null

  if (type === INVALID_LABWARE_FILE) {
    warning = THIS_FILE_IS_NOT_A_VALID_DEFINITION
  } else if (type === DUPLICATE_LABWARE_FILE) {
    warning = THIS_FILE_CONFLICTS_WITH_ANOTHER_DEFINITION
  } else if (type === OPENTRONS_LABWARE_FILE) {
    warning = THIS_FILE_CONFLICTS_WITH_AN_OPENTRONS_DEFINITION
  }

  return (
    <li className={cx(styles.item, { [styles.invalid]: warning })}>
      <p className={styles.item_category_column}>{displayCategory}</p>
      <div className={styles.item_name_column}>
        <p className={styles.item_primary_name}>{displayName}</p>
        <p className={styles.item_titled_name}>
          <span className={styles.titled_name_title}>{FILE_NAME}</span>
          <span>{basename(filename)}</span>
        </p>
        <p className={styles.item_titled_name}>
          <span className={styles.titled_name_title}>{API_NAME}</span>
          <span>{apiName}</span>
        </p>
        {warning !== null && (
          <div className={styles.item_warning_wrapper}>
            <Warning>
              <p>{warning}</p>
            </Warning>
          </div>
        )}
      </div>
      <p className={styles.item_date_column}>
        {format(new Date(created), 'yyyy-MM-dd')}
      </p>
    </li>
  )
}
