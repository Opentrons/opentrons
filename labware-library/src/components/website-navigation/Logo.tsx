// top nav bar logo image
import styles from './styles.module.css'

import logoSrc from './images/ot-logo-full.png'

export function Logo(): JSX.Element {
  return (
    <a
      href="https://opentrons.com/"
      target="_blank"
      rel="noopener noreferrer"
      data-gtm-category="l-header"
      data-gtm-label="logo"
      data-gtm-action="click"
    >
      <img className={styles.logo} src={logoSrc} />
    </a>
  )
}
