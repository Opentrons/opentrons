// @flow
import * as React from 'react'
import { Icon, PrimaryButton, Link, type Mount } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import {
  type RobotCalibrationCheckComparison,
  CHECK_TRANSFORM_TYPE_DECK,
  CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET,
  CHECK_TRANSFORM_TYPE_UNKNOWN,
  type CHECK_TRANSFORM_TYPE,
} from '../../calibration'
import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import { getBadOutcomeHeader } from './utils'
import styles from './styles.css'

const DECK_CAL_BLURB =
  'To resolve this issue, please exit robot calibration check and perform a deck calibration. View'
const THIS_ARTICLE = 'this article'
const TO_LEARN = 'to learn more'
const FOLLOW_INSTRUCTIONS = 'and follow the instructions provided.'
const TROUBLESHOOT_BLURB = 'To troubleshoot this issue, please consult'
const BAD_OUTCOME_URL =
  'http://support.opentrons.com/en/articles/4028788-checking-your-ot-2-s-calibration'
const CONTINUE_BLURB = 'You may also continue forward to the next check.'

export function BadOutcomeBody(props: {|
  transform: CHECK_TRANSFORM_TYPE,
|}): React.Node {
  const { transform } = props
  switch (transform) {
    case CHECK_TRANSFORM_TYPE_DECK:
      return (
        <>
          <p className={styles.difference_body}>
            {DECK_CAL_BLURB}
            &nbsp;
            <Link href={BAD_OUTCOME_URL} external>
              {THIS_ARTICLE}
            </Link>
            &nbsp;
            {TO_LEARN}
          </p>
          <p className={styles.difference_body}>{CONTINUE_BLURB}</p>
        </>
      )
    case CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET:
    case CHECK_TRANSFORM_TYPE_UNKNOWN:
      return (
        <p className={styles.difference_body}>
          {TROUBLESHOOT_BLURB}
          &nbsp;
          <Link href={BAD_OUTCOME_URL} external>
            {THIS_ARTICLE}
          </Link>
          &nbsp;
          {FOLLOW_INSTRUCTIONS}
        </p>
      )
    default:
      return null
  }
}
