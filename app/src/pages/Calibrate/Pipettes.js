// @flow
// setup pipettes component
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import * as Sessions from '../../sessions'
import { selectors as robotSelectors } from '../../robot'
import { PIPETTE_MOUNTS, fetchPipettes } from '../../pipettes'
import { getConnectedRobot } from '../../discovery'
import { getFeatureFlags } from '../../config'
import { mockTipLengthCalibrationSessionAttributes } from '../../sessions/__fixtures__'

import { Page } from '../../components/Page'
import { TipProbe } from '../../components/TipProbe'
import { CalibrateTipLength } from '../../components/CalibrateTipLength'
import {
  PipetteTabs,
  Pipettes as PipettesContents,
} from '../../components/calibrate-pipettes'
import { SessionHeader } from '../../components/SessionHeader'

import type { ContextRouter } from 'react-router-dom'
import type { Dispatch } from '../../types'
import type { Mount } from '../../pipettes/types'
import { CalibrateTipLengthControl } from './CalibrateTipLengthControl'

type Props = ContextRouter

export function Pipettes(props: Props): React.Node {
  const { mount } = props.match.params
  const dispatch = useDispatch<Dispatch>()
  const robot = useSelector(getConnectedRobot)
  const ff = useSelector(getFeatureFlags)
  const robotName = robot?.name || null
  const tipracksByMount = useSelector(robotSelectors.getTipracksByMount)
  const pipettes = useSelector(robotSelectors.getPipettes)

  const changePipetteUrl =
    robotName !== null ? `/robots/${robotName}/instruments` : '/robots'

  React.useEffect(() => {
    robotName && dispatch(fetchPipettes(robotName))
  }, [dispatch, robotName])

  const currentMount: Mount | null =
    PIPETTE_MOUNTS.find(m => m === mount) || null

  const currentPipette = pipettes.find(p => p.mount === currentMount) || null

  // TODO: get real session
  const tipLengthCalibrationSession: Sessions.TipLengthCalibrationSession = {
    ...mockTipLengthCalibrationSessionAttributes,
    id: 'fake_session_id',
  }

  return (
    <Page titleBarProps={{ title: <SessionHeader /> }}>
      <PipetteTabs currentMount={currentMount} />
      <PipettesContents
        {...{
          currentMount,
          pipettes,
          tipracksByMount,
          changePipetteUrl,
        }}
      />
      {robotName &&
        !!currentPipette &&
        (ff.enableTipLengthCal ? (
          <CalibrateTipLengthControl
            mount={currentPipette.mount}
            robotName={robotName}
            hasCalibrated={currentPipette.probed}
          />
        ) : (
          <TipProbe {...currentPipette} />
        ))}
    </Page>
  )
}
