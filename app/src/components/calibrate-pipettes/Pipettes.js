// @flow
import type { InstrumentInfoProps } from '@opentrons/components'
import { InstrumentGroup } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

import { PIPETTE_MOUNTS } from '../../pipettes'
import type { Mount } from '../../pipettes/types'
import type { Pipette, TiprackByMountMap } from '../../robot/types'
import styles from './styles.css'

export type PipettesProps = {|
  currentMount: Mount | null,
  pipettes: Array<Pipette>,
  tipracksByMount: TiprackByMountMap,
  changePipetteUrl: string,
|}

export function Pipettes(props: PipettesProps): React.Node {
  const { currentMount, pipettes, tipracksByMount } = props

  const infoByMount = PIPETTE_MOUNTS.reduce<
    $Shape<{|
      left?: InstrumentInfoProps,
      right?: InstrumentInfoProps,
    |}>
  >((result, mount) => {
    const pipette = pipettes.find(p => p.mount === mount)
    const tiprack = tipracksByMount[mount]
    const pipetteConfig = pipette?.modelSpecs
    const isDisabled = !pipette || mount !== currentMount

    const details = !pipetteConfig
      ? { description: 'N/A', tiprackModel: 'N/A' }
      : {
          description: pipetteConfig.displayName,
          tiprackModel:
            tiprack?.definition?.metadata.displayName || tiprack?.name || 'N/A',
          pipetteSpecs: pipetteConfig,
        }

    result[mount] = {
      mount,
      isDisabled,
      className: cx(styles.instrument, styles[mount]),
      infoClassName: styles.instrument_info,
      ...details,
    }

    return result
  }, {})

  return <InstrumentGroup {...infoByMount} />
}
