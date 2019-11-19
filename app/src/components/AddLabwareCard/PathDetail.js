// @flow

import * as React from 'react'

import { InputField } from '@opentrons/components'
import styles from './styles.css'

// TODO(mc, 2019-11-18): i18n
const CUSTOM_LABWARE_DEFINITIONS_FOLDER = 'Custom Labware Definitions Folder'

export type PathDetailProps = {|
  path: string,
|}

export function PathDetail(props: PathDetailProps) {
  return (
    <div className={styles.path_detail}>
      <h4 className={styles.path_detail_title}>
        {CUSTOM_LABWARE_DEFINITIONS_FOLDER}
      </h4>
      <InputField
        readOnly
        value={props.path}
        type="text"
        onFocus={(e: SyntheticFocusEvent<HTMLInputElement>) => {
          e.currentTarget.select()
        }}
      />
    </div>
  )
}
