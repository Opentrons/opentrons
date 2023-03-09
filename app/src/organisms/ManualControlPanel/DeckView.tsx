import * as React from 'react'

import { getDeckDefFromRobotType } from '@opentrons/shared-data'

import { RobotWorkSpace, Icon, SIZE_3, RobotCoordsForeignDiv } from '@opentrons/components'
import { getStandardDeckViewLayerBlockList } from '../../molecules/DeckThumbnail/utils/getStandardDeckViewLayerBlockList'
import { getStandardDeckViewBox } from '../../organisms/Devices/ProtocolRun/utils/getStandardDeckViewBox'
import type { VectorOffset } from '@opentrons/api-client'
import type { RobotModel } from '../../redux/discovery/types'

interface DeckViewProps {
  robotModel: RobotModel
  lastKnownPosition: VectorOffset | null
  handleMoveToXYCoords: (x: number, y: number) => void
  isCommandInProgress: boolean
}
export function DeckView(props: DeckViewProps): JSX.Element | null {
  const { robotModel, lastKnownPosition, handleMoveToXYCoords, isCommandInProgress } = props

  const deckDef = getDeckDefFromRobotType(robotModel)
  return (

    <RobotWorkSpace
      deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotModel)}
      deckDef={deckDef}
      viewBox={getStandardDeckViewBox(robotModel)}
      handleCoordinateClick={handleMoveToXYCoords}
    >
      {() => (
        <>
          {!isCommandInProgress && lastKnownPosition != null ? <circle cx={lastKnownPosition.x} cy={lastKnownPosition.y} r="5" fill="red"></circle> : null}
          {isCommandInProgress ? (
            <RobotCoordsForeignDiv x='190' y='115'>
              <Icon spin name="ot-spinner" size={SIZE_3} />
            </RobotCoordsForeignDiv>
          ) : null}
        </>
      )}
    </RobotWorkSpace>
  )
}
