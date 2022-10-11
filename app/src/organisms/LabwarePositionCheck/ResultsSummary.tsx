import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, SPACING, JUSTIFY_SPACE_BETWEEN, ALIGN_CENTER } from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import { NeedHelpLink } from '../CalibrationPanels'

import type { ResultsSummaryStep } from './types'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

interface ResultsSummaryProps extends ResultsSummaryStep {
  protocolData: CompletedProtocolAnalysis
}
export const ResultsSummary = (props: ResultsSummaryProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const { protocolData } = props

  const handleApplyOffsets: React.MouseEventHandler<HTMLButtonElement> = _e => {
    console.log('TODO: apply offsets')
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
