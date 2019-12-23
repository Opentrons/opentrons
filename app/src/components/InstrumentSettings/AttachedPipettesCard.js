// @flow
// attached pipettes container card
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  LEFT,
  RIGHT,
  fetchPipettes,
  fetchPipetteSettings,
  getAttachedPipettes,
  getAttachedPipetteSettings,
} from '../../pipettes'

import { PipetteInfo } from './PipetteInfo'
import { CardContentFlex } from '../layout'
import { Card, useInterval } from '@opentrons/components'

import type { State, Dispatch } from '../../types'
import type { Mount } from '../../pipettes/types'

type Props = {|
  robotName: string,
  makeChangeUrl: (mount: Mount) => string,
  makeConfigureUrl: (mount: Mount) => string,
|}

// TODO(mc, 2019-12-09): i18n
const PIPETTES = 'Pipettes'

const FETCH_PIPETTES_INTERVAL_MS = 5000

export function AttachedPipettesCard(props: Props) {
  const { robotName, makeChangeUrl, makeConfigureUrl } = props
  const dispatch = useDispatch<Dispatch>()

  const pipettes = useSelector((state: State) =>
    getAttachedPipettes(state, robotName)
  )
  const settings = useSelector((state: State) =>
    getAttachedPipetteSettings(state, robotName)
  )

  useInterval(
    () => {
      dispatch(fetchPipettes(robotName))
      dispatch(fetchPipetteSettings(robotName))
    },
    FETCH_PIPETTES_INTERVAL_MS,
    true
  )

  return (
    <Card title={PIPETTES}>
      <CardContentFlex>
        <PipetteInfo
          mount={LEFT}
          pipette={pipettes.left}
          changeUrl={makeChangeUrl(LEFT)}
          settingsUrl={settings.left ? makeConfigureUrl(LEFT) : null}
        />
        <PipetteInfo
          mount={RIGHT}
          pipette={pipettes.right}
          changeUrl={makeChangeUrl(RIGHT)}
          settingsUrl={settings.right ? makeConfigureUrl(RIGHT) : null}
        />
      </CardContentFlex>
    </Card>
  )
}
