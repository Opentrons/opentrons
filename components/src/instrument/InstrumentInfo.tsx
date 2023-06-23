import * as React from 'react'
import cx from 'classnames'

import { FLEX_ROBOT_TYPE, LEFT, RobotType } from '@opentrons/shared-data'
import { InfoItem } from './InfoItem'
import { InstrumentDiagram } from './InstrumentDiagram'
import styles from './instrument.css'

import type { Mount } from '../robot-types'
import type { InstrumentDiagramProps } from './InstrumentDiagram'

export interface InstrumentInfoProps {
  /** 'left' or 'right' */
  mount: Mount
  /** optional robotType standardized to OT-2 Standard */
  robotType?: RobotType
  /** if true, show labels 'LEFT PIPETTE' / 'RIGHT PIPETTE' */
  showMountLabel?: boolean | null
  /** human-readable description, eg 'p300 Single-channel' */
  description: string
  /** paired tiprack model */
  tiprackModel?: string
  /** if disabled, pipette & its info are grayed out */
  isDisabled: boolean
  /** specs of mounted pipette */
  pipetteSpecs?: InstrumentDiagramProps['pipetteSpecs'] | null
  /** classes to apply */
  className?: string
  /** classes to apply to the info group child */
  infoClassName?: string
  /** children to display under the info */
  children?: React.ReactNode
}

export function InstrumentInfo(props: InstrumentInfoProps): JSX.Element {
  const { robotType = 'OT-2 Standard' } = props
  const baseClassname = cx(
    styles.pipette,
    { [styles.disabled]: props.isDisabled },
    props.className
  )

  const mountStyle = props.mount === LEFT ? styles.flex_left : styles.right
  const flexClassname = cx(mountStyle, baseClassname)

  const className =
    robotType === FLEX_ROBOT_TYPE
      ? flexClassname
      : cx(styles[props.mount], baseClassname)

  return (
    <div className={className}>
      <div className={cx(styles.pipette_info, props.infoClassName)}>
        <InfoItem
          title={props.showMountLabel ? `${props.mount} pipette` : 'pipette'}
          value={props.description}
        />
        {props.tiprackModel && (
          <InfoItem title="tip rack" value={props.tiprackModel} />
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
