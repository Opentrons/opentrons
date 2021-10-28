import * as React from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import {
  useInterval,
  Text,
  FONT_BODY_1_DARK_SEMIBOLD,
  FONT_HUGE_DARK_SEMIBOLD,
  SPACING_3,
} from '@opentrons/components'

export function Timer(): JSX.Element {
  const { t } = useTranslation('run_details')

  // TODO(bh, 2021-10-14): replace now timer with real run time
  const [now, setNow] = React.useState(Date.now())
  useInterval(() => setNow(Date.now()), 500)

  // TODO(bh, 2021-10-14): replace hardcoded startTime with real start time
  const startTime = 1634243123471

  return (
    <>
      <Text css={FONT_BODY_1_DARK_SEMIBOLD} marginBottom={SPACING_3}>{`${t(
        'start_time'
      )}: ${format(startTime, 'pppp')}`}</Text>
      <Text css={FONT_BODY_1_DARK_SEMIBOLD}>{`${t('run_time')}:`}</Text>
      <Text css={FONT_HUGE_DARK_SEMIBOLD} marginBottom={SPACING_3}>
        {format(now, 'hh:mm:ss')}
      </Text>
    </>
  )
}
