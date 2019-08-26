// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CalibrationInfoContent from '../CalibrationInfoContent'
import { PrimaryButton } from '@opentrons/components'

import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'
import attachSingle from '../../img/attach_tip_single.png'
import attachMulti from '../../img/attach_tip_multi.png'

import type { Dispatch } from '../../types'
import type { TipProbeProps } from './types'

type Props = TipProbeProps

export default function AttachTipPanel(props: Props) {
  const { mount, channels } = props
  const dispatch = useDispatch<Dispatch>()
  const tipracksByMount = useSelector(robotSelectors.getTipracksByMount)
  const tiprack = tipracksByMount[mount]
  const tiprackName =
    tiprack?.definition?.metadata.displayName || tiprack?.name || null

  // $FlowFixMe: robotActions.probeTip is not typed
  const handleTipProbe = () => dispatch(robotActions.probeTip(mount))

  const leftChildren = (
    <div>
      <p>
        Place a spare tip
        {tiprackName !== null && (
          <>
            {' from'}
            <br />
            <strong>{tiprackName}</strong>
            <br />{' '}
          </>
        )}
        on pipette before continuing
      </p>
      <PrimaryButton onClick={handleTipProbe}>
        Confirm Tip Attached
      </PrimaryButton>
    </div>
  )

  const imgSrc = channels === 1 ? attachSingle : attachMulti

  const rightChildren = <img src={imgSrc} alt="attach tip" />

  return (
    <CalibrationInfoContent
      leftChildren={leftChildren}
      rightChildren={rightChildren}
    />
  )
}
