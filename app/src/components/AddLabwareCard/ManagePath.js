// @flow

import React, { useReducer } from 'react'

import { LabeledButton, InputField } from '@opentrons/components'
import { IconCta } from '../IconCta'
import { ConfirmResetPathModal } from './ConfirmResetPathModal'
import styles from './styles.css'

// TODO(mc, 2019-11-18): i18n
const CUSTOM_LABWARE_DEFINITIONS_FOLDER = 'Custom Labware Definitions Folder'
const CHANGE_SOURCE = 'Change Source'
const RESET_SOURCE = 'Reset Source'
const OPEN_SOURCE = 'Open Source'

export type ManagePathProps = {|
  path: string,
  onChangePath: () => mixed,
  onResetPath: () => mixed,
  onOpenPath: () => mixed,
|}

const handleFocus = (e: SyntheticFocusEvent<HTMLInputElement>) => {
  e.currentTarget.select()
}

export function ManagePath(props: ManagePathProps) {
  const { path, onChangePath, onResetPath, onOpenPath } = props
  const [confirmResetIsOpen, toggleConfirmResetIsOpen] = useReducer(
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
            iconName="folder-open"
            text={CHANGE_SOURCE}
            onClick={onChangePath}
          />
          <IconCta
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
