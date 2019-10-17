// @flow
// setup pipettes component
import * as React from 'react'
import { useDispatch } from 'react-redux'

import { InstrumentGroup } from '@opentrons/components'
import { constants as robotConstants } from '../../robot'
import { fetchPipettes } from '../../robot-api'
import InstrumentItem from './InstrumentItem'
import { SectionContentHalf } from '../layout'
import InfoSection from './InfoSection'
import InstrumentWarning from './InstrumentWarning'

import type { Dispatch } from '../../types'
import type { Robot } from '../../discovery'
import usePipetteInfo from './usePipetteInfo'

type Props = {| robot: Robot |}

const { PIPETTE_MOUNTS } = robotConstants
const TITLE = 'Required Pipettes'

function ProtocolPipettes(props: Props) {
  const dispatch: Dispatch = useDispatch()
  const pipetteInfo = usePipetteInfo(props.robot.name)
  React.useEffect(() => {
    dispatch(fetchPipettes(props.robot))
  }, [dispatch, props.robot])
  if (pipetteInfo.length === 0) return null

  const changePipetteUrl = `/robots/${props.robot.name}/instruments`

  const pipettesMatch = pipetteInfo.every(p => p.pipettesMatch)

  const infoByMount = PIPETTE_MOUNTS.reduce((acc, mount) => {
    const actualPipette = pipetteInfo.find(p => p.mount === mount)
    const pipetteConfig = actualPipette?.modelSpecs
    return {
      ...acc,
      [mount]: {
        mount,
        ...actualPipette,
        pipetteSpecs: pipetteConfig,
      },
    }
  }, {})

  return (
    <InfoSection title={TITLE}>
      <SectionContentHalf>
        <InstrumentGroup {...infoByMount} showMountLabel />
        {/* {pipetteInfo.map(p => (
          <InstrumentItem key={p.mount} match={p.pipettesMatch} mount={p.mount}>
            {p.displayName}
          </InstrumentItem>
        ))} */}
      </SectionContentHalf>
      {!pipettesMatch && (
        <InstrumentWarning instrumentType="pipette" url={changePipetteUrl} />
      )}
    </InfoSection>
  )
}

export default ProtocolPipettes
