// @flow
// labware creator display card
import * as React from 'react'
import { Link } from 'react-router-dom'
import { getPublicPath } from '../../public-path'
import styles from './styles.css'

type Props = {
  isResultsEmpty?: boolean,
}
const SUPPORT_URL =
  'https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions'

export function CustomLabwareCard(props: Props): React.Node {
  const PROMPT_TEXT = props.isResultsEmpty
    ? 'No results found'
    : "Don't see your labware here?"
  return (
    <li className={styles.custom_labware_card}>
      <span className={styles.custom_labware_text}>{PROMPT_TEXT}</span>

      <a
        className={styles.btn_white}
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more about creating custom definitions
      </a>
      <Link to={`${getPublicPath()}create`} className={styles.btn_blue}>
        Go to the labware creator
      </Link>
    </li>
  )
}
