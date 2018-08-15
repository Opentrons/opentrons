// @flow
import * as React from 'react'
import cx from 'classnames'
import {SLOT_WIDTH_MM, SLOT_HEIGHT_MM} from './constants.js'
import styles from './Labware.css'

type Props = {className?: ?string}

const rectStyle = {rx: 6, transform: 'translate(0.8 0.8) scale(0.985)'} // SVG styles not allowed in CSS (round corners) -- also stroke gets cut off so needs to be transformed
// TODO (Eventually) Ian 2017-12-07 where should non-CSS SVG styles belong?

export default function LabwareOutline (props: Props) {
  return <rect {...rectStyle}
    x='0' y='0'
    className={cx(styles.plate_outline, props.className)}
    width={SLOT_WIDTH_MM}
    height={SLOT_HEIGHT_MM}
  />
}
