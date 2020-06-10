// @flow
// setup pipettes component
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { selectors as robotSelectors } from '../../robot'
import { PIPETTE_MOUNTS, fetchPipettes } from '../../pipettes'
import { getConnectedRobot } from '../../discovery'
import { getFeatureFlags } from '../../config'
import { mockSession } from '../../sessions/__fixtures__'
import { mockTipLengthCalibrationSessionDetails } from '../../calibration/__fixtures__'

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
  const tipLengthCalibrationSession = {
    ...mockSession,
    details: mockTipLengthCalibrationSessionDetails,
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
