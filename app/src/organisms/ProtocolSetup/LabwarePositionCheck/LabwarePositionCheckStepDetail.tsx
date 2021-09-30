import {
  Box,
  Btn,
  C_BLUE,
  C_NEAR_WHITE,
  FONT_SIZE_CAPTION,
  Link,
  SPACING_1,
  SPACING_2,
  SPACING_5,
  SPACING_7,
} from '@opentrons/components'
import map from 'lodash/map'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useIntroInfo, useLabwareIdsBySection } from './hooks'
import { LabwarePositionCheckStepDetailModal } from './LabwarePositionCheckStepDetailModal'
import { useLabwareRenderInfoById } from '../hooks'

export const LabwarePositionCheckStepDetail = (): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  const labwareIds = useLabwareIdsBySection()
  const labwareRenderInfoById = useLabwareRenderInfoById()
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
  //   console.log(numberOfTips)
  //   console.log(labwareIds)
  //   console.log(PRIMARY_PIPETTE_TIPRACKS)
  //   console.log(CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE)
  //   console.log(primaryTipRackName)
  //   const firstTiprack = primaryTipRackName.split()
  //   const labwaresAndTipracks = PRIMARY_PIPETTE_TIPRACKS.concat(
  //     CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE
  //   )
  //   const allLabwaresAndTipracks = firstTiprack.concat(labwaresAndTipracks)
  //   console.log(allLabwaresAndTipracks)
  const labwareDefs = map(
    labwareRenderInfoById,
    ({ labwareDef }) => labwareDef.metadata.displayName
  )
  console.log(labwareDefs, 'labwre info')
 // const labwareDefinition = map(labwareDefs, {{labwareDef} => labwareDef)

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
        width="30rem"
        marginTop={SPACING_2}
        marginLeft={SPACING_7}
        marginRight={SPACING_1}
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
