// attached pipettes container card
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Card,
  useInterval,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_3,
} from '@opentrons/components'

import {
  LEFT,
  RIGHT,
  fetchPipettes,
  fetchPipetteSettings,
  getAttachedPipettes,
  getAttachedPipetteSettings,
} from '../../../redux/pipettes'

import { PipetteInfo } from './PipetteInfo'

import type { State, Dispatch } from '../../../redux/types'
import {
  fetchPipetteOffsetCalibrations,
  fetchTipLengthCalibrations,
} from '../../../redux/calibration'
import type { Mount } from '../../../redux/pipettes/types'

interface Props {
  robotName: string
  makeChangeUrl: (mount: Mount) => string
  makeConfigureUrl: (mount: Mount) => string
  isChangingOrConfiguringPipette: boolean
}

// TODO(mc, 2019-12-09): i18n
const PIPETTES = 'Pipettes'

const FETCH_PIPETTES_INTERVAL_MS = 5000

export function AttachedPipettesCard(props: Props): JSX.Element {
  const {
    robotName,
    makeChangeUrl,
    makeConfigureUrl,
    isChangingOrConfiguringPipette,
  } = props
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
      dispatch(fetchPipetteOffsetCalibrations(robotName))
      dispatch(fetchTipLengthCalibrations(robotName))
    },
    FETCH_PIPETTES_INTERVAL_MS,
    true
  )

  return (
    <Card title={PIPETTES}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} padding={SPACING_3}>
        <PipetteInfo
          robotName={robotName}
          mount={LEFT}
          pipette={pipettes.left}
          changeUrl={makeChangeUrl(LEFT)}
          settingsUrl={settings.left ? makeConfigureUrl(LEFT) : null}
          isChangingOrConfiguringPipette={isChangingOrConfiguringPipette}
        />
        <PipetteInfo
          robotName={robotName}
          mount={RIGHT}
          pipette={pipettes.right}
          changeUrl={makeChangeUrl(RIGHT)}
          settingsUrl={settings.right ? makeConfigureUrl(RIGHT) : null}
          isChangingOrConfiguringPipette={isChangingOrConfiguringPipette}
        />
      </Flex>
    </Card>
  )
}
