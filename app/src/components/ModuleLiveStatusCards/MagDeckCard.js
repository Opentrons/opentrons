// @flow
import { getModuleDisplayName } from '@opentrons/shared-data'
import * as React from 'react'

import type { MagneticModule } from '../../modules/types'
import { StatusCard } from './StatusCard'
import { StatusItem } from './StatusItem'
import styles from './styles.css'

type Props = {|
  module: MagneticModule,
  isCardExpanded: boolean,
  toggleCard: boolean => mixed,
|}

export const MagDeckCard = ({
  module,
  isCardExpanded,
  toggleCard,
}: Props): React.Node => (
  <StatusCard
    title={getModuleDisplayName(module.model)}
    isCardExpanded={isCardExpanded}
    toggleCard={toggleCard}
  >
    <div className={styles.card_row}>
      <StatusItem status={module.status} />
    </div>
  </StatusCard>
)
