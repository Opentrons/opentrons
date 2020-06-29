// @flow
// setup pipettes component
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { ContextRouter } from 'react-router-dom'

import {
  Pipettes as PipettesContents,
  PipetteTabs,
} from '../../components/calibrate-pipettes'
import { CalibrateTipLength } from '../../components/CalibrateTipLength'
import { Page } from '../../components/Page'
import { SessionHeader } from '../../components/SessionHeader'
import { TipProbe } from '../../components/TipProbe'
import { getFeatureFlags } from '../../config'
import { getConnectedRobot } from '../../discovery'
import { fetchPipettes, PIPETTE_MOUNTS } from '../../pipettes'
import type { Mount } from '../../pipettes/types'
import { selectors as robotSelectors } from '../../robot'
import * as Sessions from '../../sessions'
import { mockTipLengthCalibrationSessionAttributes } from '../../sessions/__fixtures__'
import type { Dispatch } from '../../types'

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
      {!!currentPipette &&
        (ff.enableTipLengthCal ? (
          <CalibrateTipLength
            mount={currentPipette.mount}
            isMulti={currentPipette.channels > 1}
            probed={currentPipette.probed}
            robotName={robotName}
            session={tipLengthCalibrationSession}
          />
        ) : (
          <TipProbe {...currentPipette} />
        ))}
    </Page>
  )
}
