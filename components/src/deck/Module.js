// @flow
import * as React from 'react'
import cx from 'classnames'

import {
  getModuleDisplayName,
  type ModuleModel,
  type DeckSlot,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { Icon } from '../icons'
import { RobotCoordsForeignDiv } from './RobotCoordsForeignDiv'
import styles from './Module.css'

const FLIPPED_SLOTS = ['3', '6', '9']
export type ModuleProps = {|
  /** module model */
  model: ModuleModel,
  /** display mode: 'default', 'present', 'missing', or 'info' */
  mode: 'default' | 'present' | 'missing' | 'info',
  /** slot details of the location of this module */
  slot: DeckSlot,
|}

export function Module(props: ModuleProps): React.Node {
  const { model, slot } = props
  let x = 0
  let y = 0
  let { xDimension: width, yDimension: height } = slot.boundingBox
  const shouldFlip = FLIPPED_SLOTS.includes(slot.id)

  // TODO: BC 2019-7-23 get these from shared-data module defs, once available
  switch (model) {
    case MAGNETIC_MODULE_V1:
    case MAGNETIC_MODULE_V2: {
      width = 137
      height = 91
      x = -7
      y = 4
      break
    }
    case TEMPERATURE_MODULE_V1:
    case TEMPERATURE_MODULE_V2: {
      width = 196
      height = 91
      x = -66
      y = 4
      break
    }
    case THERMOCYCLER_MODULE_V1: {
      // TODO: BC 2019-07-24 these are taken from snapshots of the cad file, they should
      // be included in the module spec schema and added to the data
      width = 172
      height = 259.7
      x = -22.125
    }
  }

  return (
    <RobotCoordsForeignDiv
      width={width}
      height={height}
      x={x}
      y={y - height}
      transformWithSVG
      extraTransform={`rotate(${shouldFlip ? 180 : 0}, ${slot.boundingBox
        .xDimension / 2}, ${slot.boundingBox.yDimension / -2})`}
      innerDivProps={{
        className: cx(styles.module, { [styles.flipped]: shouldFlip }),
      }}
    >
      <ModuleItemContents {...props} shouldFlip={shouldFlip} />
    </RobotCoordsForeignDiv>
  )
}

type ModuleItemContentsProps = {| ...ModuleProps, shouldFlip: boolean |}
function ModuleItemContents(props: ModuleItemContentsProps) {
  const { mode, model, shouldFlip } = props
  const displayName = getModuleDisplayName(model)

  const message =
    mode === 'missing' ? (
      <>
        <p className={styles.module_review_text}>Missing:</p>
        {displayName.split(' ').map((chunk, i) => (
          <p key={i} className={styles.module_review_text}>
            {chunk}
          </p>
        ))}
      </>
    ) : (
      <>
        {displayName.split(' ').map((chunk, i) => (
          <p key={i} className={styles.module_review_text}>
            {chunk}
          </p>
        ))}
      </>
    )

  const iconClassName = cx(styles.module_review_icon, {
    [styles.module_review_icon_missing]: mode === 'missing',
    [styles.module_review_icon_present]: mode === 'present',
    [styles.right_icon]: shouldFlip,
  })

  const iconNameByMode = {
    missing: 'alert-circle',
    present: 'check-circle',
    info: 'usb',
    default: 'usb',
  }

  const contents = [
    <Icon
      key="icon"
      className={iconClassName}
      x="8"
      y="0"
      svgWidth="16"
      name={iconNameByMode[mode] || 'usb'}
    />,
    <div key="label" className={styles.module_text_wrapper}>
      {message}
    </div>,
  ]
  return <>{shouldFlip ? contents.reverse() : contents}</>
}
