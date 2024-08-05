import * as React from 'react'
import {
  COLORS,
  DIRECTION_ROW,
  Flex,
  PrimaryButton,
  RobotCoordinateSpace,
  SingleSlotFixture,
} from '@opentrons/components'
import {
  CutoutId,
  RobotType,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'
import { LabwareSelectionModal } from '../../../components/LabwareSelectionModal/LabwareSelectionModal'

interface ZoomedInProps {
  robotType: RobotType
  cutoutId: CutoutId
  goBack: () => void
}
export const ZoomedInSlot = (props: ZoomedInProps): JSX.Element => {
  const { robotType, cutoutId, goBack } = props
  const deckDef = getDeckDefFromRobotType(robotType)

  return (
    <>
      <PrimaryButton onClick={goBack}>exit</PrimaryButton>
      <Flex flexDirection={DIRECTION_ROW}>
        <RobotCoordinateSpace
          height="100%"
          deckDef={deckDef}
          viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
        >
          <SingleSlotFixture
            key={`${cutoutId}_${robotType}`}
            cutoutId={cutoutId}
            deckDefinition={deckDef}
            showExpansion={cutoutId === 'cutoutA1'}
            fixtureBaseColor={COLORS.grey35}
          />
        </RobotCoordinateSpace>
        <LabwareSelectionModal />
      </Flex>
    </>
  )
}
