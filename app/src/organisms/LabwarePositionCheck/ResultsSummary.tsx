import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, SPACING, JUSTIFY_SPACE_BETWEEN, ALIGN_CENTER } from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { CompletedProtocolAnalysis, getVectorDifference } from '@opentrons/shared-data'
import { NeedHelpLink } from '../CalibrationPanels'

import type { ResultsSummaryStep, WorkingOffset } from './types'
import { LabwareOffsetCreateData } from '@opentrons/api-client'
import { getModuleInitialLoadInfo } from '../Devices/ProtocolRun/utils/getModuleInitialLoadInfo'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

interface ResultsSummaryProps extends ResultsSummaryStep {
  protocolData: CompletedProtocolAnalysis
  workingOffsets: WorkingOffset[]
}
export const ResultsSummary = (props: ResultsSummaryProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const { protocolData, workingOffsets } = props

  const offsetsToApply = React.useMemo(() => {
    if (protocolData == null) return []
    return workingOffsets.map<LabwareOffsetCreateData>(({initialPosition, finalPosition, labwareId, location}) => {
      const {definitionUri} = protocolData.labware.find(l => l.id === labwareId) ?? {}
      if (finalPosition == null || initialPosition == null || definitionUri == null) {
        throw new Error(`cannot create offset for labware with id ${labwareId}, in location ${JSON.stringify(location)}, with initial position ${initialPosition}, and final position ${finalPosition}`)
      }
      const vector  = getVectorDifference(finalPosition, initialPosition)
      return { definitionUri, location, vector }
    })
  }, [workingOffsets])
  
  const handleApplyOffsets: React.MouseEventHandler<HTMLButtonElement> = _e => {
    console.log('TODO: apply offsets', offsetsToApply)
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <StyledText as="h1">{t('new_labware_offset_data')}</StyledText>
      <Flex
        width="100%"
        marginTop={SPACING.spacing6}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink href={LPC_HELP_LINK_URL} />
        <PrimaryButton onClick={handleApplyOffsets}>
          {t('apply_offsets')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
