// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import cx from 'classnames'

import type {PipettesResponse} from '../../http-api-client'
import type {Pipette} from '../../robot'
import {constants as robotConstants} from '../../robot'

import {getPipette} from '@opentrons/shared-data'
import {InstrumentGroup, AlertItem} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  pipettes: Array<Pipette>,
  currentPipette: ?Pipette,
  actualPipettes: ?PipettesResponse,
  changePipetteUrl: string,
}

const {PIPETTE_MOUNTS} = robotConstants
const ATTACH_ALERT = 'Pipette missing'
const CHANGE_ALERT = 'Incorrect pipette attached'

export default function Pipettes (props: Props) {
  const {currentPipette, pipettes, actualPipettes, changePipetteUrl} = props
  const currentMount = currentPipette && currentPipette.mount

  const infoByMount = PIPETTE_MOUNTS.reduce((result, mount) => {
    const pipette = pipettes.find((p) => p.mount === mount)
    // TODO(mc, 2018-04-25)
    const pipetteConfig = pipette
      ? getPipette(pipette.name)
      : null

    const isDisabled = !pipette || mount !== currentMount
    const details = !pipetteConfig
      ? {description: 'N/A', tipType: 'N/A'}
      : {
        description: pipetteConfig.displayName,
        tipType: `${pipetteConfig.nominalMaxVolumeUl} ul`,
        channels: pipetteConfig.channels,
      }

    const actualModel = actualPipettes && actualPipettes[mount].model
    let showAlert = false
    let alertType = ''

    // only show alert if a pipette is on this mount in the protocol
    if (pipetteConfig) {
      if (actualModel == null) {
        showAlert = true
        alertType = 'attach'
      } else if (actualModel !== pipetteConfig.model) {
        showAlert = true
        alertType = 'change'
      }
    }

    const children = showAlert && (
      <div>
        <AlertItem
          type='warning'
          className={styles.alert}
          title={alertType === 'attach' ? ATTACH_ALERT : CHANGE_ALERT}
        />
        <p className={styles.wrong_pipette_message}>
          {'Go to the '}
          <Link to={changePipetteUrl}>
            robot settings
          </Link>
          {` panel to ${alertType} pipette.`}
        </p>
      </div>
    )

    return {
      ...result,
      [mount]: {
        mount,
        isDisabled,
        children,
        className: cx(styles.instrument, styles[mount]),
        infoClassName: styles.instrument_info,
        ...details,
      },
    }
  }, {})

  return (
    <InstrumentGroup {...infoByMount} />
  )
}
