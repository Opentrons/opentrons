import * as React from 'react'
import {
  Box,
  Btn,
  C_BLUE,
  C_NEAR_WHITE,
  FONT_SIZE_CAPTION,
  Link,
  SPACING_1,
  SPACING_2,
  SPACING_7,
} from '@opentrons/components'
import { Trans, useTranslation } from 'react-i18next'
import { useIntroInfo } from './hooks'
import { LabwarePositionCheckStepDetailModal } from './LabwarePositionCheckStepDetailModal'
import { LabwarePositionCheckStep } from './types'
import { useProtocolDetails } from '../../RunDetails/hooks'

interface LabwarePositionCheckStepDetailProps {
  selectedStep: LabwarePositionCheckStep
}
export const LabwarePositionCheckStepDetail = (
  props: LabwarePositionCheckStepDetailProps
): JSX.Element | null => {
  const { labwareId } = props.selectedStep
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  console.log(introInfo)
  const { protocolData } = useProtocolDetails()
  console.log(protocolData)
  const [
    showLabwarePositionCheckStepDetailModal,
    setLabwarePositionCheckStepDetailModal,
  ] = React.useState<boolean>(false)
  //if (protocolData == null) return null
  console.log('labware id is ', labwareId)

  const labwareDefId = protocolData.labware[labwareId].definitionId

  const displayName =
    protocolData.labwareDefinitions[labwareDefId].metadata.displayName
  if (introInfo == null) return null
  const { numberOfTips } = introInfo

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
        <Trans
          t={t}
          i18nKey={
            displayName.includes('Tip Rack')
              ? 'labware_step_detail_tiprack'
              : 'labware_step_detail_labware'
          }
          count={numberOfTips}
          values={{ labware_name: displayName, tiprack_name: displayName }}
          components={{
            bold: <strong />,
          }}
        />
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
