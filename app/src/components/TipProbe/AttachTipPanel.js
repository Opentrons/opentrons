// @flow
import { PrimaryButton } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import attachMulti from '../../img/attach_tip_multi.png'
import attachSingle from '../../img/attach_tip_single.png'
import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'
import type { Dispatch } from '../../types'
import { CalibrationInfoContent } from '../CalibrationInfoContent'
import styles from './tip-probe.css'
import type { TipProbeProps } from './types'

type Props = TipProbeProps

export function AttachTipPanel(props: Props): React.Node {
  const { mount, channels } = props
  const dispatch = useDispatch<Dispatch>()
  const tipracksByMount = useSelector(robotSelectors.getTipracksByMount)
  const tiprack = tipracksByMount[mount]
  const tiprackName =
    tiprack?.definition?.metadata.displayName || tiprack?.name || null

  const handleTipProbe = () => dispatch(robotActions.probeTip(mount))
  const isMulti = channels > 1

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
        on {isMulti ? 'the back-most channel of' : ''} the pipette before
        continuing
      </p>
      <PrimaryButton onClick={handleTipProbe}>
        Confirm Tip Attached
      </PrimaryButton>
    </div>
  )

  const imgSrc = isMulti ? attachMulti : attachSingle

  const rightChildren = (
    <img
      src={imgSrc}
      alt="attach tip"
      className={cx(styles.pipette_diagram, styles[mount])}
    />
  )

  return (
    <CalibrationInfoContent
      leftChildren={leftChildren}
      rightChildren={rightChildren}
    />
  )
}
