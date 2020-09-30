// @flow

import * as React from 'react'

import { LabeledButton, InputField } from '@opentrons/components'
import { IconCta } from '../IconCta'
import { ConfirmResetPathModal } from './ConfirmResetPathModal'
import styles from './styles.css'

// TODO(mc, 2019-11-18): i18n
const CUSTOM_LABWARE_DEFINITIONS_FOLDER = 'Custom Labware Definitions Folder'
const CHANGE_SOURCE = 'Change Source'
const RESET_SOURCE = 'Reset Source'
const OPEN_SOURCE = 'Open Source'

// button names
export const OPEN_SOURCE_NAME = 'open-source'
export const CHANGE_SOURCE_NAME = 'change-source'
export const RESET_SOURCE_NAME = 'reset-source'

export type ManagePathProps = {|
  path: string,
  onChangePath: () => mixed,
  onResetPath: () => mixed,
  onOpenPath: () => mixed,
|}

const handleFocus = (e: SyntheticFocusEvent<HTMLInputElement>) => {
  e.currentTarget.select()
}

export function ManagePath(props: ManagePathProps): React.Node {
  const { path, onChangePath, onResetPath, onOpenPath } = props
  const [confirmResetIsOpen, toggleConfirmResetIsOpen] = React.useReducer(
    open => !open,
    false
  )
  const handleResetPath = () => {
    toggleConfirmResetIsOpen()
    onResetPath()
  }

  return (
    <>
      <LabeledButton
        label={CUSTOM_LABWARE_DEFINITIONS_FOLDER}
        buttonProps={{
          name: OPEN_SOURCE_NAME,
          onClick: onOpenPath,
          children: OPEN_SOURCE,
        }}
      >
        <InputField
          readOnly
          value={path}
          type="text"
          onFocus={handleFocus}
          className={styles.labeled_value}
        />
        <div className={styles.flex_bar}>
          <IconCta
            name={CHANGE_SOURCE_NAME}
            iconName="folder-open"
            text={CHANGE_SOURCE}
            onClick={onChangePath}
          />
          <IconCta
            name={RESET_SOURCE_NAME}
            iconName="refresh"
            text={RESET_SOURCE}
            onClick={toggleConfirmResetIsOpen}
          />
        </div>
      </LabeledButton>
      {confirmResetIsOpen && (
        <ConfirmResetPathModal
          onCancel={toggleConfirmResetIsOpen}
          onConfirm={handleResetPath}
        />
      )}
    </>
  )
}
