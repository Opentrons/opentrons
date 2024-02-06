// labware creator display card
import * as React from 'react'
import { Link } from 'react-router-dom'
import { getPublicPath } from '../../public-path'
import {
  CUSTOM_LABWARE_PROMPT_NO_RESULTS,
  CUSTOM_LABWARE_PROMPT_W_RESULTS,
  CUSTOM_LABWARE_SUPPORT_BTN,
  LABWARE_CREATOR_BTN,
} from '../../localization'
import styles from './styles.module.css'

interface Props {
  isResultsEmpty?: boolean
}

const SUPPORT_URL =
  'https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions'

export function CustomLabwareCard(props: Props): JSX.Element {
  const PROMPT_TEXT = props.isResultsEmpty
    ? CUSTOM_LABWARE_PROMPT_NO_RESULTS
    : CUSTOM_LABWARE_PROMPT_W_RESULTS
  return (
    <li className={styles.custom_labware_card}>
      <span className={styles.custom_labware_text}>{PROMPT_TEXT}</span>

      <a
        className={styles.btn_white}
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {CUSTOM_LABWARE_SUPPORT_BTN}
      </a>
      <Link to={`${getPublicPath()}create`} className={styles.btn_blue}>
        {LABWARE_CREATOR_BTN}
      </Link>
    </li>
  )
}
