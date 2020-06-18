// @flow
import * as React from 'react'
import { Link } from '@opentrons/components'

import {
  CHECK_TRANSFORM_TYPE_DECK,
  CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET,
  CHECK_TRANSFORM_TYPE_UNKNOWN,
} from '../../sessions'
import type { CHECK_TRANSFORM_TYPE } from '../../sessions/types'

const DECK_CAL_BLURB =
  'To resolve this issue, please exit robot calibration check and perform a deck calibration. View'
const THIS_ARTICLE = 'this article'
const TO_LEARN = 'to learn more'
const FOLLOW_INSTRUCTIONS = 'and follow the instructions provided.'
const TROUBLESHOOT_BLURB = 'To troubleshoot this issue, please consult'
const BAD_OUTCOME_URL =
  'http://support.opentrons.com/en/articles/4028788-checking-your-ot-2-s-calibration'

export function BadOutcomeBody(props: {|
  transform: CHECK_TRANSFORM_TYPE,
|}): React.Node {
  const { transform } = props
  switch (transform) {
    case CHECK_TRANSFORM_TYPE_DECK:
      return (
        <>
          {DECK_CAL_BLURB}
          &nbsp;
          <Link href={BAD_OUTCOME_URL} external>
            {THIS_ARTICLE}
          </Link>
          &nbsp;
          {TO_LEARN}
        </>
      )
    case CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET:
    case CHECK_TRANSFORM_TYPE_UNKNOWN:
      return (
        <>
          {TROUBLESHOOT_BLURB}
          &nbsp;
          <Link href={BAD_OUTCOME_URL} external>
            {THIS_ARTICLE}
          </Link>
          &nbsp;
          {FOLLOW_INSTRUCTIONS}
        </>
      )
    default:
      return null
  }
}
