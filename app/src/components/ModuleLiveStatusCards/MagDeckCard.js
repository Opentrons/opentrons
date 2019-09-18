// @flow
import * as React from 'react'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type { MagDeckModule } from '../../robot-api'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'

type Props = {|
  module: MagDeckModule,
  isCardExpanded: boolean,
  toggleCard: boolean => mixed,
|}

const MagDeckCard = ({ module, isCardExpanded, toggleCard }: Props) => (
  <StatusCard
    title={getModuleDisplayName(module.name)}
    isCardExpanded={isCardExpanded}
    toggleCard={toggleCard}
  >
    <CardContentRow>
      <StatusItem status={module.status} />
    </CardContentRow>
  </StatusCard>
)

export default MagDeckCard
