// @flow
import * as React from 'react'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type { MagDeckModule } from '../../robot-api'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'

type Props = {|
  module: MagDeckModule,
  initiallyExpanded: boolean,
|}

const MagDeckCard = ({ module, initiallyExpanded }: Props) => (
  <StatusCard
    title={getModuleDisplayName(module.name)}
    initiallyExpanded={initiallyExpanded}
  >
    <CardContentRow>
      <StatusItem status={module.status} />
    </CardContentRow>
  </StatusCard>
)

export default MagDeckCard
