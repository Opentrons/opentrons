import * as React from 'react'

import { getDeckDefFromRobotType } from '@opentrons/shared-data'

import { RobotWorkSpace } from '@opentrons/components'
import { getStandardDeckViewLayerBlockList } from '../../molecules/DeckThumbnail/utils/getStandardDeckViewLayerBlockList'
import { getStandardDeckViewBox } from '../../organisms/Devices/ProtocolRun/utils/getStandardDeckViewBox'
import type { VectorOffset } from '@opentrons/api-client'
import type { RobotModel } from '../../redux/discovery/types'

interface DeckViewProps {
  robotModel: RobotModel
  lastKnownPosition: VectorOffset 
  setLastKnownPosition: (position: VectorOffset) => void
}
export function DeckView(props: DeckViewProps): JSX.Element | null {
  const { robotModel, lastKnownPosition } = props

  const deckDef = getDeckDefFromRobotType(robotModel)
  return (

    <RobotWorkSpace
      deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotModel)}
      deckDef={deckDef}
      viewBox={getStandardDeckViewBox(robotModel)}
    >
      {({getRobotCoordsFromDOMCoords}) => (
        <rect onClick={e => {
          console.log('event', e)
          console.log('gtranstlir', getRobotCoordsFromDOMCoords(e?.currentTarget?.x, e?.currentTarget?.y))
        }} x={lastKnownPosition.x} y={lastKnownPosition.y} height="10" width="10" fill="red"></rect>
      )}
    </RobotWorkSpace>
  )
}


