// @flow
import * as React from 'react'
import cx from 'classnames'
import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
} from '@opentrons/shared-data'

import type { Mount } from '../robot-types'
import { InfoItem } from './InfoItem.js'
import { InstrumentDiagram } from './InstrumentDiagram'

import styles from './instrument.css'

export type InstrumentInfoProps = {|
  /** 'left' or 'right' */
  mount: Mount,
  /** if true, show labels 'LEFT PIPETTE' / 'RIGHT PIPETTE' */
  showMountLabel?: ?boolean,
  /** human-readable description, eg 'p300 Single-channel' */
  description: string,
  /** paired tiprack model */
  tiprackModel?: string,
  /** if disabled, pipette & its info are grayed out */
  isDisabled: boolean,
  /** specs of mounted pipette */
  pipetteSpecs?: ?PipetteModelSpecs | ?PipetteNameSpecs,
  /** classes to apply */
  className?: string,
  /** classes to apply to the info group child */
  infoClassName?: string,
  /** children to display under the info */
  children?: React.Node,
|}

export function InstrumentInfo(props: InstrumentInfoProps) {
  const className = cx(
    styles.pipette,
    styles[props.mount],
    { [styles.disabled]: props.isDisabled },
    props.className
  )

  return (
    <div className={className}>
      <div className={cx(styles.pipette_info, props.infoClassName)}>
        <InfoItem
          title={props.showMountLabel ? `${props.mount} pipette` : 'pipette'}
          value={props.description}
        />
        {props.tiprackModel && (
          <InfoItem title={'tip rack'} value={props.tiprackModel} />
        )}
        {props.children}
      </div>
      {props.pipetteSpecs && (
        <InstrumentDiagram
          pipetteSpecs={props.pipetteSpecs}
          className={styles.pipette_icon}
          mount={props.mount}
        />
      )}
    </div>
  )
}
