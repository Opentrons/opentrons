// @flow

import * as React from 'react'
import { OutlineButton } from '@opentrons/components'

import styles from './styles.css'

// TODO(mc, 2019-11-18): i18n
const CHANGE_SOURCE = 'Change Source'

export type ChangePathButtonProps = {|
  onChangePath: () => mixed,
|}

export function ChangePathButton(props: ChangePathButtonProps) {
  return (
    <OutlineButton
      className={styles.change_path_button}
      onClick={props.onChangePath}
    >
      {CHANGE_SOURCE}
    </OutlineButton>
  )
}
