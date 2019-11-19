// @flow

import * as React from 'react'

import { LabeledButton, InputField } from '@opentrons/components'
import styles from './styles.css'

// TODO(mc, 2019-11-18): i18n
const CUSTOM_LABWARE_DEFINITIONS_FOLDER = 'Custom Labware Definitions Folder'
const CHANGE_SOURCE = 'Change Source'

export type ManagePathProps = {|
  path: string,
  onChangePath: () => mixed,
|}

export function ManagePath(props: ManagePathProps) {
  const { path, onChangePath } = props
  const handleFocus = (e: SyntheticFocusEvent<HTMLInputElement>) => {
    e.currentTarget.select()
  }

  return (
    <LabeledButton
      label={CUSTOM_LABWARE_DEFINITIONS_FOLDER}
      buttonProps={{
        onClick: onChangePath,
        children: CHANGE_SOURCE,
      }}
    >
      <InputField
        readOnly
        value={path}
        type="text"
        onFocus={handleFocus}
        className={styles.labeled_value}
      />
    </LabeledButton>
  )
}
