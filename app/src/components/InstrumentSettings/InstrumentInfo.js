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
  name: string,
  onChangeClick: () => mixed,
  showSettings: boolean,
}

const LABEL_BY_MOUNT = {
  left: 'Left pipette',
  right: 'Right pipette',
}

export default function PipetteInfo(props: Props) {
  const { mount, model, name, onChangeClick, showSettings } = props
  const label = LABEL_BY_MOUNT[mount]
  const pipette = model ? getPipetteModelSpecs(model) : null
  const channels = pipette?.channels
  const direction = model ? 'change' : 'attach'

  const changeUrl = `/robots/${name}/instruments/pipettes/change/${mount}`
  const configUrl = `/robots/${name}/instruments/pipettes/config/${mount}`

  const className = cx(styles.pipette_card, {
    [styles.right]: mount === 'right',
  })

  return (
    <div className={className}>
      <LabeledValue
        label={label}
        value={(model || 'None').split('_').join(' ')}
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
            channels={channels}
            className={styles.pipette_diagram}
          />
        )}
      </div>
    </div>
  )
}
