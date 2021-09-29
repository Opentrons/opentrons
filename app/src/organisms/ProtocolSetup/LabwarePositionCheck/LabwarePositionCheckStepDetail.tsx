import {
  Box,
  Btn,
  C_BLUE,
  C_NEAR_WHITE,
  FONT_SIZE_CAPTION,
  Link,
  SPACING_2,
  SPACING_5,
} from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useIntroInfo, useLabwareIdsBySection } from './hooks'
import { LabwarePositionCheckStepDetailModal } from './LabwarePositionCheckStepDetailModal'

const HOW_TO_TELL_IF_PIPETTE_IS_CENTER_LINK = '' // replace with actual link!

export const LabwarePositionCheckStepDetail = (): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  const labwareIds = useLabwareIdsBySection()
  const [
    showLabwarePositionCheckStepDetailModal,
    setLabwarePositionCheckStepDetailModal,
  ] = React.useState<boolean>(false)
  const {
    PRIMARY_PIPETTE_TIPRACKS,
    CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
  } = labwareIds
  if (introInfo == null) return null
  const { numberOfTips, primaryTipRackName } = introInfo
  console.log(numberOfTips)
  console.log(labwareIds)
  console.log(PRIMARY_PIPETTE_TIPRACKS)
  console.log(CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE)
  console.log(primaryTipRackName)
  const firstTiprack = primaryTipRackName.split()
  const labwaresAndTipracks = PRIMARY_PIPETTE_TIPRACKS.concat(
    CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE
  )
  const allLabwaresAndTipracks = firstTiprack.concat(labwaresAndTipracks)
  console.log(allLabwaresAndTipracks)
  return (
    <React.Fragment>
      {showLabwarePositionCheckStepDetailModal && (
        <LabwarePositionCheckStepDetailModal
          onCloseClick={() => setLabwarePositionCheckStepDetailModal(false)}
        />
      )}
      <Box
        fontSize={FONT_SIZE_CAPTION}
        padding={SPACING_2}
        width="13.25rem"
        marginLeft={SPACING_5}
        boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
        borderRadius="4px"
        backgroundColor={C_NEAR_WHITE}
      >
        {t('labware_step_detail_labware', { count: numberOfTips })}
        <Btn
          as={Link}
          fontSize={FONT_SIZE_CAPTION}
          color={C_BLUE}
          marginLeft="0.1rem"
          onClick={() => setLabwarePositionCheckStepDetailModal(true)}
        >
          {t('labware_step_detail_link')}
        </Btn>
      </Box>
    </React.Fragment>
  )
}
