// @flow
import * as React from 'react'
import cx from 'classnames'

import type {Mount} from '../robot-types'
import InfoItem from './InfoItem.js'
import InstrumentDiagram from './InstrumentDiagram'

import styles from './instrument.css'

export type InstrumentInfoProps = {
  /** 'left' or 'right' */
  mount: Mount,
  /** human-readable description, eg 'p300 Single-channel' */
  description: string,
  /** recommended tip type */
  tipType: string,
  /** if disabled, pipette & its info are grayed out */
  isDisabled: boolean,
  /** usually 1 or 8 */
  channels?: number,
  /** classes to apply */
  className?: string,
  /** classes to apply to the info group child */
  infoClassName?: string,
  /** children to display under the info */
  children?: React.Node,
}

export default function InstrumentInfo (props: InstrumentInfoProps) {
  const className = cx(
    styles.pipette,
    styles[props.mount],
    { [styles.disabled]: props.isDisabled },
    props.className
  )

  return (
    <div className={className}>
      <div className={cx(styles.pipette_info, props.infoClassName)}>
        <InfoItem title={'pipette'} value={props.description} />
        <InfoItem title={'suggested tip type'} value={props.tipType} />
        {props.children}
      </div>
      <InstrumentDiagram
        channels={props.channels}
        className={styles.pipette_icon}
      />
    </div>
  )
}
