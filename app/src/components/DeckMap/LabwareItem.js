// @flow
import {
  humanizeLabwareType,
  Icon,
  Labware as LabwareComponent,
  LabwareRender,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import {
  getLabwareDisplayName,
  SLOT_RENDER_HEIGHT,
  SLOT_RENDER_WIDTH,
} from '@opentrons/shared-data'
import cx from 'classnames'
import * as React from 'react'
import { Link } from 'react-router-dom'

import { getLegacyLabwareDef } from '../../getLabware'
import { type Labware } from '../../robot'
import styles from './styles.css'

export type LabwareItemProps = {|
  highlighted?: boolean | null,
  areTipracksConfirmed?: boolean,
  handleClick?: () => void,
  labware: $Exact<Labware>,
  x: number,
  y: number,
|}

export function LabwareItem(props: LabwareItemProps): React.Node {
  const { labware, highlighted, areTipracksConfirmed, handleClick } = props
  const { isTiprack, confirmed, name, type, slot, definition } = labware

  const showSpinner = highlighted && labware.calibration === 'moving-to-slot'
  const clickable = highlighted !== null
  const disabled =
    clickable &&
    ((isTiprack && confirmed) || (!isTiprack && areTipracksConfirmed === false))

  let title
  let item
  let width
  let height

  if (definition) {
    item = <LabwareRender definition={definition} />
    width = definition.dimensions.xDimension
    height = definition.dimensions.yDimension
    title = getLabwareDisplayName(definition)
  } else {
    item = <LabwareComponent definition={getLegacyLabwareDef(type)} />
    width = SLOT_RENDER_WIDTH
    height = SLOT_RENDER_HEIGHT
    title = humanizeLabwareType(type)
  }

  const renderContents = () => {
    const contents = showSpinner ? (
      <div className={styles.labware_spinner_wrapper}>
        <Icon className={styles.spinner} name="ot-spinner" spin />
      </div>
    ) : (
      <div className={styles.name_overlay}>
        <p className={styles.display_name} title={title}>
          {/* title is capitalized by CSS, and "µL" capitalized is "ML" */}
          {title.replace('µL', 'uL')}
        </p>
        <p className={styles.subtitle} title={name}>
          {name}
        </p>
      </div>
    )
    if (clickable && !disabled) {
      return (
        <Link
          to={`/calibrate/labware/${slot}`}
          onClick={handleClick}
          className={styles.labware_ui_content}
        >
          {contents}
        </Link>
      )
    }
    return <div className={styles.labware_ui_content}>{contents}</div>
  }
  return (
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
        {renderContents()}
      </RobotCoordsForeignDiv>
    </g>
  )
}
