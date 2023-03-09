import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Icon,
  Btn,
  DIRECTION_ROW,
  SPACING,
  useSwipe,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import {
  CurrentRunningProtocol,
  RunningProtocolList,
} from '../../organisms/OnDeviceDisplay/RunningProtocol'

import type { OnDeviceRouteParams } from '../../App/types'

type ScreenOption = 'CurrentRunningProtocol' | 'RunningProtocolList'

export function RunningProtocol(): JSX.Element {
  const { t } = useTranslation()
  const { runId } = useParams<OnDeviceRouteParams>()
  const [currentOption, setCurrentOption] = React.useState<ScreenOption | null>(
    null
  )
  const swipe = useSwipe()

  return (
    <Flex>
      <CurrentRunningProtocol runId={runId} />
      <RunningProtocolList runId={runId} />
    </Flex>
  )
}
