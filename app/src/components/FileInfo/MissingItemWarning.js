// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import cx from 'classnames'
import { OutlineButton } from '@opentrons/components'

import styles from './styles.css'
import { SectionContentHalf } from '../layout'

export type MissingItemWarningProps = {|
  instrumentType: string,
  url: string,
  isBlocking?: boolean,
|}

export function MissingItemWarning(props: MissingItemWarningProps) {
  const { instrumentType, url, isBlocking = false } = props
  return (
    <SectionContentHalf className={styles.align_center}>
      <OutlineButton
        Component={Link}
        to={url}
        className={styles.instrument_button}
      >
        GO TO {instrumentType} SETUP
      </OutlineButton>
      <p
        className={cx(styles.instrument_warning, {
          [styles.blocking]: isBlocking,
        })}
      >
        Required {instrumentType} is missing
      </p>
    </SectionContentHalf>
  )
}
