// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import cx from 'classnames'

import type {Mount} from '../../robot'

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
  onClick: () => mixed,
}

// TODO(mc, 2018-03-30): volume and channels should come from the API
const RE_CHANNELS = /p\d+_(single|multi)/

const LABEL_BY_MOUNT = {
  left: 'Left pipette',
  right: 'Right pipette',
}

export default function PipetteInfo (props: Props) {
  const {mount, model, name, onClick} = props
  const label = LABEL_BY_MOUNT[mount]
  const channelsMatch = model && model.match(RE_CHANNELS)
  const channels = channelsMatch && channelsMatch[1]
  const direction = props.model
    ? 'change'
    : 'attach'

  const url = `/robots/${name}/instruments/pipettes/${mount}`

  const className = cx(styles.pipette_card, {
    [styles.right]: props.mount === 'right',
  })

  return (
    <div className={className}>
      <LabeledValue
        label={label}
        value={(model || 'None').split('_').join(' ')}
      />
      <OutlineButton Component={Link} to={url} onClick={onClick}>
        {direction}
      </OutlineButton>
      <div className={styles.image}>
        {channels && (
          <InstrumentDiagram
            channels={channels === 'multi' ? 8 : 1}
            className={styles.pipette_diagram}
          />
        )}
      </div>
    </div>
  )
}
