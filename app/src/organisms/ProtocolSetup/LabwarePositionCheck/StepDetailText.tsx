import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Box,
  Btn,
  C_BLUE,
  FONT_SIZE_CAPTION,
  Link,
  SPACING_2,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { useProtocolDetails } from '../../RunDetails/hooks'
import { useIntroInfo } from './hooks'
import { LabwarePositionCheckStepDetailModal } from './LabwarePositionCheckStepDetailModal'
import type { LabwarePositionCheckStep } from './types'

interface StepDetailTextProps {
  selectedStep: LabwarePositionCheckStep
}
export const StepDetailText = (
  props: StepDetailTextProps
): JSX.Element | null => {
  const { labwareId } = props.selectedStep
  const { t } = useTranslation('labware_position_check')
  const introInfo = useIntroInfo()
  const { protocolData } = useProtocolDetails()
  const [
    showLabwarePositionCheckStepDetailModal,
    setLabwarePositionCheckStepDetailModal,
  ] = React.useState<boolean>(false)
  if (protocolData == null || introInfo == null) return null
  const labwareDefId = protocolData.labware[labwareId].definitionId
  const displayName =
    protocolData.labwareDefinitions[labwareDefId].metadata.displayName
  const { numberOfTips } = introInfo

  return (
    <React.Fragment>
      {showLabwarePositionCheckStepDetailModal && (
        <LabwarePositionCheckStepDetailModal
          onCloseClick={() => setLabwarePositionCheckStepDetailModal(false)}
        />
      )}
      <Box padding={SPACING_2} justifyContent={JUSTIFY_CENTER}>
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
