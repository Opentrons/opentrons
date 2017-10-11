import React from 'react'
import styles from '../css/style.css'

const Well = ({x, y, wellContent, ...otherProps}) =>
  <div
    className={styles.wellRound}
    data-well-number={wellContent}
    data-well-x={x}
    data-well-y={y}
    style={{'--well-color': 'white'}} // <- set well color here (probably, add it in wellMatrix)
    {...otherProps}
    // onMouseDown={e => console.log('mouse down', {target: e.target, x: e.clientX, y: e.clientY})}
    // onMouseUp={e => console.log('mouse up', {target: e.target, x: e.clientX, y: e.clientY})}
  />

export default Well
