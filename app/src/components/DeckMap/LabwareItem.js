// @flow
import * as React from 'react'
import cx from 'classnames'
import { Link } from 'react-router-dom'
import { SLOT_RENDER_HEIGHT, SLOT_RENDER_WIDTH } from '@opentrons/shared-data'

import {
  RobotCoordsForeignDiv,
  LabwareRender,
  Labware as LabwareComponent,
  Icon,
  humanizeLabwareType,
  type LabwareComponentProps,
} from '@opentrons/components'

import { type Labware, type SessionModule } from '../../robot'
import { getLatestLabwareDef, getLegacyLabwareDef } from '../../util'

import styles from './styles.css'

export type LabwareItemProps = {
  ...$Exact<LabwareComponentProps>,
  labware: {
    ...$Exact<Labware>,
    highlighted?: boolean,
    disabled?: boolean,
    showSpinner?: boolean,
    onClick?: () => void,
    url?: string,
  },
  module: ?SessionModule,
}

export default function LabwareItem(props: LabwareItemProps) {
  const { labware, highlighted, areTipracksConfirmed, handleClick } = props

  const { isTiprack, confirmed, name, type, slot } = labware

  const showSpinner = highlighted && labware.calibration === 'moving-to-slot'
  const disabled =
    (isTiprack && confirmed) || (!isTiprack && areTipracksConfirmed === false)

  const title = humanizeLabwareType(type)

  let item
  let width
  let height

  if (labware.isLegacy) {
    item = <LabwareComponent definition={getLegacyLabwareDef(type)} />
    width = SLOT_RENDER_WIDTH
    height = SLOT_RENDER_HEIGHT
  } else {
    const def = getLatestLabwareDef(type)
    item = <LabwareRender definition={def} />
    width = def.dimensions.xDimension
    height = def.dimensions.yDimension
  }
  return (
    <>
      <g
        className={cx({ [styles.disabled]: disabled })}
        transform={`translate(${props.x}, ${props.y})`}
      >
        {item}
        <RobotCoordsForeignDiv
          width={width}
          height={height}
          x={0}
          y={0 - height}
          transformWithSVG
          innerDivProps={{
            className: cx(styles.labware_ui_wrapper, {
              [styles.highlighted_border_div]: highlighted,
            }),
          }}
        >
          <Link
            to={`/calibrate/labware/${slot}`}
            onClick={handleClick}
            className={styles.labware_ui_link}
          >
            {showSpinner ? (
              <div className={styles.labware_spinner_wrapper}>
                <Icon className={styles.spinner} name="ot-spinner" spin />
              </div>
            ) : (
              <div className={styles.name_overlay}>
                <p className={styles.display_name} title={title}>
                  {title}
                </p>
                <p className={styles.subtitle} title={name}>
                  {name}
                </p>
              </div>
            )}
          </Link>
        </RobotCoordsForeignDiv>
      </g>
    </>
  )
}
