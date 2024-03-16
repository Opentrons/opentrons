import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { ODDBackButton } from '../../molecules/ODDBackButton'
import { PipetteRecalibrationODDWarning } from '../../pages/InstrumentsDashboard/PipetteRecalibrationODDWarning'
import { getShowPipetteCalibrationWarning } from '../Devices/utils'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolInstrumentMountItem } from '../InstrumentMountItem'

import type { GripperData, PipetteData } from '@opentrons/api-client'
import type { GripperModel } from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/ProtocolSetup'
import { isGripperInCommands } from '../../resources/protocols/utils'

export interface ProtocolSetupParamtersProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ProtocolSetupParameters({
  runId,
  setSetupScreen,
}: ProtocolSetupParamtersProps): JSX.Element {
  const { t, i18n } = useTranslation('protocol_setup')
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)


  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gridGap={SPACING.spacing8}
    >
        Run Time Parameters
      <ODDBackButton
        label={t('instruments')}
        onClick={() => setSetupScreen('prepare to run')}
      />
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        paddingX={SPACING.spacing24}
      >
        <ColumnLabel>{t('location')}</ColumnLabel>
        <ColumnLabel>
          {i18n.format(t('calibration_status'), 'sentenceCase')}
        </ColumnLabel>
      </Flex>
   
    </Flex>
  )
}

const ColumnLabel = styled.p`
  flex: 1;
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${COLORS.grey60};
`
