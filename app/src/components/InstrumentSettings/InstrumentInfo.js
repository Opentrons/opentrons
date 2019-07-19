// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import cx from 'classnames'

import type { Mount } from '../../robot'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import {
  LabeledValue,
  OutlineButton,
  InstrumentDiagram,
} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  mount: Mount,
  model: ?string,
  robotName: string,
  onChangeClick: () => mixed,
  showSettings: boolean,
}

const LABEL_BY_MOUNT = {
  left: 'Left pipette',
  right: 'Right pipette',
}

export default function PipetteInfo(props: Props) {
  const { mount, model, robotName, onChangeClick, showSettings } = props
  const label = LABEL_BY_MOUNT[mount]
  const pipette = model ? getPipetteModelSpecs(model) : null

  const { displayName, channels } = pipette || {}

  const direction = model ? 'change' : 'attach'

  const changeUrl = `/robots/${robotName}/instruments/pipettes/change/${mount}`
  const configUrl = `/robots/${robotName}/instruments/pipettes/config/${mount}`

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
        <OutlineButton Component={Link} to={changeUrl} onClick={onChangeClick}>
          {direction}
        </OutlineButton>
        {model && showSettings && (
          <OutlineButton Component={Link} to={configUrl}>
            settings
          </OutlineButton>
        )}
      </div>
      <div className={styles.image}>
        {channels && (
          <InstrumentDiagram
            pipetteSpecs={pipette}
            mount={mount}
            className={styles.pipette_diagram}
          />
        )}
      </div>
    </div>
  )
}
