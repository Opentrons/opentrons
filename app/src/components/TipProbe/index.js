// @flow
// TipProbe controls
import { usePrevious } from '@opentrons/components'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { actions as robotActions } from '../../robot'
import { getCalibrationRequest } from '../../robot/selectors'
import type { Dispatch } from '../../types'
import { CalibrationInfoBox } from '../CalibrationInfoBox'
import { ErrorModal } from '../modals'
import { AttachTipPanel } from './AttachTipPanel'
import { ContinuePanel } from './ContinuePanel'
import { InstrumentMovingPanel } from './InstrumentMovingPanel'
import { RemoveTipPanel } from './RemoveTipPanel'
import type { TipProbeProps, TipProbeState } from './types'
import { UnprobedPanel } from './UnprobedPanel'

const PROBE_ERROR_HEADING = 'Error during tip probe'
const PROBE_ERROR_DESCRIPTION =
  'The above error occurred while attempting to tip probe. Please try again.'

const PANEL_BY_CALIBRATION: {
  [TipProbeState]: React.ComponentType<TipProbeProps>,
} = {
  unprobed: UnprobedPanel,
  'moving-to-front': InstrumentMovingPanel,
  'waiting-for-tip': AttachTipPanel,
  probing: InstrumentMovingPanel,
  'waiting-for-remove-tip': RemoveTipPanel,
  done: ContinuePanel,
}

export function TipProbe(props: TipProbeProps): React.Node {
  const { mount, probed } = props
  const dispatch = useDispatch<Dispatch>()
  const [probeState, setProbeState] = React.useState<TipProbeState>('unprobed')
  const prevProbeState = usePrevious(probeState)
  const title = `${mount} pipette calibration`
  const Panel = PANEL_BY_CALIBRATION[probeState]
  const calRequest = useSelector(getCalibrationRequest)

  React.useEffect(() => {
    const { mount: calMount, type: calType, inProgress, error } = calRequest
    let nextProbeState = 'unprobed'

    if (!error && calMount === mount) {
      if (calType === 'MOVE_TO_FRONT') {
        nextProbeState = inProgress ? 'moving-to-front' : 'waiting-for-tip'
      } else if (calType === 'PROBE_TIP') {
        if (inProgress) {
          nextProbeState = 'probing'
        } else if (!probed) {
          nextProbeState = 'waiting-for-remove-tip'
        } else if (
          prevProbeState === 'waiting-for-remove-tip' ||
          prevProbeState === 'done'
        ) {
          nextProbeState = 'done'
        }
      }
    }

    setProbeState(nextProbeState)
  }, [calRequest, mount, probed, prevProbeState])

  return (
    <>
      <CalibrationInfoBox confirmed={probed} title={title}>
        <Panel {...props} />
      </CalibrationInfoBox>
      {calRequest.error !== null && (
        <ErrorModal
          heading={PROBE_ERROR_HEADING}
          description={PROBE_ERROR_DESCRIPTION}
          error={calRequest.error}
          close={() => dispatch(robotActions.clearCalibrationRequest())}
        />
      )}
    </>
  )
}
