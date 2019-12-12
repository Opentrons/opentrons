// @flow
// attached pipettes container card
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { clearMoveResponse } from '../../http-api-client'
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
import type { Robot } from '../../discovery/types'

type Props = {|
  robot: Robot,
|}

// TODO(mc, 2019-12-09): i18n
const PIPETTES = 'Pipettes'

const FETCH_PIPETTES_INTERVAL_MS = 5000

// TODO(mc, 2019-12-09): either move to `src/nav` or don't use routes
const makeChangeUrl = (robotName: string, mount: string) =>
  `/robots/${robotName}/instruments/pipettes/change/${mount}`

const makeSettingsUrl = (robotName: string, mount: string) =>
  `/robots/${robotName}/instruments/pipettes/config/${mount}`

export function AttachedPipettesCard(props: Props) {
  const { robot } = props
  const dispatch = useDispatch<Dispatch>()
  const clearMove = () => dispatch(clearMoveResponse(robot))

  const pipettes = useSelector((state: State) =>
    getAttachedPipettes(state, robot.name)
  )
  const settings = useSelector((state: State) =>
    getAttachedPipetteSettings(state, robot.name)
  )

  useInterval(
    () => {
      dispatch(fetchPipettes(robot.name))
      dispatch(fetchPipetteSettings(robot.name))
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
          changeUrl={makeChangeUrl(robot.name, LEFT)}
          settingsUrl={settings.left ? makeSettingsUrl(robot.name, LEFT) : null}
          onChangeClick={clearMove}
        />
        <PipetteInfo
          mount={RIGHT}
          pipette={pipettes.right}
          changeUrl={makeChangeUrl(robot.name, RIGHT)}
          settingsUrl={
            settings.right ? makeSettingsUrl(robot.name, RIGHT) : null
          }
          onChangeClick={clearMove}
        />
      </CardContentFlex>
    </Card>
  )
}
