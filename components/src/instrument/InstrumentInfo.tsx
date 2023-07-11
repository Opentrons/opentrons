import * as React from 'react'

import { LEFT, RIGHT } from '@opentrons/shared-data'
import { InfoItem } from './InfoItem'
import { InstrumentDiagram } from './InstrumentDiagram'
import styles from './instrument.css'
import { Flex } from '../primitives'
import { SPACING } from '../ui-style-constants'
import { DIRECTION_COLUMN, JUSTIFY_CENTER } from '../styles'

import type { Mount } from '../robot-types'
import type { InstrumentDiagramProps } from './InstrumentDiagram'

export interface InstrumentInfoProps {
  /** 'left' or 'right' */
  mount: Mount
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
  return (
    <Flex justifyContent={JUSTIFY_CENTER} gridGap={SPACING.spacing16}>
      {props.mount === RIGHT && props.pipetteSpecs && (
        <InstrumentDiagram
          pipetteSpecs={props.pipetteSpecs}
          className={styles.pipette_icon}
          mount={props.mount}
        />
      )}
      <Flex flexDirection={DIRECTION_COLUMN}>
        <InfoItem
          title={props.showMountLabel ? `${props.mount} pipette` : 'pipette'}
          value={props.description}
        />
        {props.tiprackModel && (
          <InfoItem title="tip rack" value={props.tiprackModel} />
        )}
      </Flex>
      {props.children}
      {props.mount === LEFT && props.pipetteSpecs && (
        <InstrumentDiagram
          pipetteSpecs={props.pipetteSpecs}
          className={styles.pipette_icon}
          mount={props.mount}
        />
      )}
    </Flex>
  )
}
