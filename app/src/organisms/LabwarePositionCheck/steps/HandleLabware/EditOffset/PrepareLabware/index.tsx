import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { TwoColumn } from '/app/molecules/InterventionModal'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'
import {
  selectActivePipette,
  selectSelectedLwOverview,
  selectSelectedLwWithOffsetDetailsMostRecentVectorOffset,
  setInitialPosition,
} from '/app/redux/protocol-runs'

import { LPCDeck } from './LPCDeck'
import { PlaceItemInstruction } from './PlaceItemInstruction'

import type { ReactNode } from 'react'
import type { EditOffsetContentProps } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/EditOffset'

export function PrepareLabware(props: EditOffsetContentProps): ReactNode {
  const { runId, commandUtils, proceedSubstep, goBackSubstep, contentHeader } =
    props
  const { toggleRobotMoving, handleConfirmLwModulePlacement } = commandUtils
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const dispatch = useDispatch()

  const pipette = useSelector(selectActivePipette(runId))!
  const pipetteId = pipette.id
  const selectedLwInfo = useSelector(selectSelectedLwOverview(runId))!
  const mostRecentVectorOffset = useSelector(
    selectSelectedLwWithOffsetDetailsMostRecentVectorOffset(runId)
  )
  const offsetLocationDetails = selectedLwInfo.offsetLocationDetails!

  const handleConfirmPlacement = (): void => {
    void toggleRobotMoving(true)
      .then(() =>
        handleConfirmLwModulePlacement(
          offsetLocationDetails,
          pipetteId,
          mostRecentVectorOffset
        )
      )
      .then(position => {
        dispatch(
          setInitialPosition(runId, {
            labwareUri: selectedLwInfo.uri,
            location: offsetLocationDetails,
            position,
          })
        )
      })
      .then(() => {
        proceedSubstep()
      })
      .finally(() => toggleRobotMoving(false))
  }

  return (
    <LPCContentContainer
      {...props}
      header={contentHeader}
      desktopHeaderBtnCopy={t('exit')}
      desktopFooterBtnCopy={t('confirm_placement')}
      oddHeaderBtnCopy={t('confirm_placement')}
      onClickButton={handleConfirmPlacement}
      onClickBack={goBackSubstep}
      tertiaryBtnProps={{ text: t('go_back'), onClick: goBackSubstep }}
    >
      <TwoColumn>
        <PlaceItemInstruction {...props} />
        <LPCDeck {...props} />
      </TwoColumn>
    </LPCContentContainer>
  )
}
