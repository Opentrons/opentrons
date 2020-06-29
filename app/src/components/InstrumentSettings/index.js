// @flow
// robot status panel with connect button
import * as React from 'react'

import type { Mount } from '../../pipettes/types'
import { CardContainer, CardRow } from '../layout'
import { AttachedModulesCard } from './AttachedModulesCard'
import { AttachedPipettesCard } from './AttachedPipettesCard'

type Props = {|
  robotName: string,
  makeChangePipetteUrl: (mount: Mount) => string,
  makeConfigurePipetteUrl: (mount: Mount) => string,
|}

export function InstrumentSettings(props: Props): React.Node {
  const { robotName, makeChangePipetteUrl, makeConfigurePipetteUrl } = props

  return (
    <CardContainer>
      <CardRow>
        <AttachedPipettesCard
          robotName={robotName}
          makeChangeUrl={makeChangePipetteUrl}
          makeConfigureUrl={makeConfigurePipetteUrl}
        />
      </CardRow>
      <CardRow>
        <AttachedModulesCard robotName={robotName} />
      </CardRow>
    </CardContainer>
  )
}
