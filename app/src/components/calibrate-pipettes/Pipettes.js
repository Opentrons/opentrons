// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import cx from 'classnames'

import { constants as robotConstants } from '../../robot'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { InstrumentGroup, AlertItem } from '@opentrons/components'
import styles from './styles.css'

import type { PipettesState } from '../../robot-api'
import type { Pipette, TiprackByMountMap } from '../../robot'

type Props = {|
  pipettes: Array<Pipette>,
  tipracksByMount: TiprackByMountMap,
  currentPipette: ?Pipette,
  actualPipettes: ?PipettesState,
  changePipetteUrl: string,
|}

const { PIPETTE_MOUNTS } = robotConstants
const ATTACH_ALERT = 'Pipette missing'
const CHANGE_ALERT = 'Incorrect pipette attached'

export default function Pipettes(props: Props) {
  const {
    currentPipette,
    pipettes,
    tipracksByMount,
    actualPipettes,
    changePipetteUrl,
  } = props
  const currentMount = currentPipette && currentPipette.mount

  const infoByMount = PIPETTE_MOUNTS.reduce((result, mount) => {
    const pipette = pipettes.find(p => p.mount === mount)
    const tiprack = tipracksByMount[mount]
    const pipetteConfig = pipette?.modelSpecs
    const actualPipetteConfig = getPipetteModelSpecs(
      actualPipettes?.[mount]?.model || ''
    )

    const isDisabled = !pipette || mount !== currentMount
    const details = !pipetteConfig
      ? { description: 'N/A', tiprackModel: 'N/A' }
      : {
          description: pipetteConfig.displayName,
          tiprackModel:
            tiprack?.definition?.metadata.displayName || tiprack?.name || 'N/A',
          pipetteSpecs: pipetteConfig,
        }

    let showAlert = false
    let alertType = ''

    // only show alert if a pipette is on this mount in the protocol
    if (pipetteConfig) {
      if (!actualPipetteConfig) {
        showAlert = true
        alertType = 'attach'
      } else if (
        actualPipetteConfig &&
        actualPipetteConfig.name !== pipetteConfig.name
      ) {
        showAlert = true
        alertType = 'change'
      }
    }

    const children = showAlert && (
      <div>
        <AlertItem
          type="warning"
          className={styles.alert}
          title={alertType === 'attach' ? ATTACH_ALERT : CHANGE_ALERT}
        />
        <p className={styles.wrong_pipette_message}>
          {'Go to the '}
          <Link to={changePipetteUrl}>robot settings</Link>
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

  return <InstrumentGroup {...infoByMount} />
}
