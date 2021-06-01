import * as React from 'react'
import { useSelector } from 'react-redux'
import partition from 'lodash/partition'
import { useTranslation } from 'react-i18next'

import { SidePanel } from '@opentrons/components'
import { selectors as robotSelectors } from '../../../redux/robot'
import { getProtocolLabwareList } from '../../../redux/calibration/labware'
import { ProtocolModuleList } from '../../../organisms/ProtocolModuleList'
import { PipetteList } from './PipetteList'
import { LabwareGroup } from './LabwareGroup'
import styles from './styles.css'

import type { State } from '../../../redux/types'

export function CalibratePanel(): JSX.Element {
  const { t } = useTranslation('protocol_calibration')
  const robotName = useSelector(robotSelectors.getConnectedRobotName)

  const allLabware = useSelector((state: State) => {
    return robotName ? getProtocolLabwareList(state, robotName) : []
  })

  const [tipracks, otherLabware] = partition(
    allLabware,
    lw => lw.type && lw.isTiprack
  )

  return (
    <SidePanel title={t('cal_panel_title')}>
      <div className={styles.setup_panel}>
        <PipetteList robotName={robotName} tipracks={tipracks} />
        <ProtocolModuleList />
        <LabwareGroup
          robotName={robotName}
          tipracks={tipracks}
          otherLabware={otherLabware}
        />
      </div>
    </SidePanel>
  )
}
