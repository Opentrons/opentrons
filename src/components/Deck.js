import React from 'react'

import styles from '../css/style.css'

console.log({styles})

const Deck = () => (
  <div className={styles.deck}>Xss</div>
)

export default Deck
