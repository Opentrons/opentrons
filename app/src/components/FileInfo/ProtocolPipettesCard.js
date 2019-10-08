// @flow
// setup pipettes component
import * as React from 'react'
import { useDispatch } from 'react-redux'

import { selectors as robotSelectors } from '../../robot'
import { fetchPipettes, getPipettesState } from '../../robot-api'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import InstrumentItem from './InstrumentItem'
import { RefreshWrapper } from '../Page'
import { SectionContentHalf } from '../layout'
import InfoSection from './InfoSection'
import InstrumentWarning from './InstrumentWarning'

import type { State, Dispatch } from '../../types'
import type { Pipette } from '../../robot'
import type { PipettesState } from '../../robot-api'
import type { Robot } from '../../discovery'
import usePipetteInfo from './usePipetteInfo'

type Props = {| robot: Robot |}

const TITLE = 'Required Pipettes'

function ProtocolPipettes(props: Props) {
  const dispatch: Dispatch = useDispatch()
  const pipetteInfo = usePipetteInfo(props.robot.name)

  if (pipetteInfo.length === 0) return null

  const changePipetteUrl = `/robots/${props.robot.name}/instruments`

  const pipettesMatch = pipetteInfo.every(p => p.pipettesMatch)

  return (
    <RefreshWrapper refresh={() => dispatch(fetchPipettes(props.robot))}>
      <InfoSection title={TITLE}>
        <SectionContentHalf>
          {pipetteInfo.map(p => (
            <InstrumentItem
              key={p.mount}
              match={p.pipettesMatch}
              mount={p.mount}
            >
              {p.displayName}
            </InstrumentItem>
          ))}
        </SectionContentHalf>
        {!pipettesMatch && (
          <InstrumentWarning instrumentType="pipette" url={changePipetteUrl} />
        )}
      </InfoSection>
    </RefreshWrapper>
  )
}

export default ProtocolPipettes
