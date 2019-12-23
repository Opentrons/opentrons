// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import cx from 'classnames'

import {
  LabeledValue,
  OutlineButton,
  InstrumentDiagram,
} from '@opentrons/components'
import styles from './styles.css'

import type { Mount, AttachedPipette } from '../../pipettes/types'

export type PipetteInfoProps = {|
  mount: Mount,
  pipette: AttachedPipette | null,
  changeUrl: string,
  settingsUrl: string | null,
|}

const LABEL_BY_MOUNT = {
  left: 'Left pipette',
  right: 'Right pipette',
}

export function PipetteInfo(props: PipetteInfoProps) {
  const { mount, pipette, changeUrl, settingsUrl } = props
  const label = LABEL_BY_MOUNT[mount]
  const displayName = pipette ? pipette.modelSpecs.displayName : null
  const channels = pipette ? pipette.modelSpecs.channels : null
  const direction = pipette ? 'change' : 'attach'

  const className = cx(styles.pipette_card, {
    [styles.right]: mount === 'right',
  })

  return (
    <div className={className}>
      <LabeledValue
        label={label}
        value={(displayName || 'None').replace(/-/, '‑')} // non breaking hyphen
        valueClassName={styles.pipette_display_name}
      />

      <div className={styles.button_group}>
        <OutlineButton Component={Link} to={changeUrl}>
          {direction}
        </OutlineButton>
        {settingsUrl !== null && (
          <OutlineButton Component={Link} to={settingsUrl}>
            settings
          </OutlineButton>
        )}
      </div>
      <div className={styles.image}>
        {channels && (
          <InstrumentDiagram
            pipetteSpecs={pipette?.modelSpecs}
            mount={mount}
            className={styles.pipette_diagram}
          />
        )}
      </div>
    </div>
  )
}
