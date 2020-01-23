// @flow
import * as React from 'react'
import i18n from '../../localization'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import styles from './SlotWarning.css'
import type { ModuleOrientation } from '../../types'

type Props = {|
  x: number,
  y: number,
  xDimension: number,
  yDimension: number,
  orientation: ModuleOrientation,
  warningType: 'gen1multichannel', // NOTE: Ian 2019-10-31 if we want more on-deck warnings, expand the type here
|}

const OVERHANG = 60

export const SlotWarning = (props: Props) => {
  const { x, y, xDimension, yDimension, orientation, warningType } = props
  const rectXOffset = orientation === 'left' ? -OVERHANG : 0
  const textXOffset = orientation === 'left' ? -1 * OVERHANG : xDimension

  return (
    <g>
      <rect
        x={x + rectXOffset}
        y={y}
        width={xDimension + OVERHANG}
        height={yDimension}
        className={styles.slot_warning}
      />
      <RobotCoordsForeignDiv
        x={x + textXOffset}
        y={y}
        className={styles.warning_text}
        width={OVERHANG}
        height={yDimension}
      >
        {i18n.t(`deck.warning.${warningType}`)}
      </RobotCoordsForeignDiv>
    </g>
  )
}
