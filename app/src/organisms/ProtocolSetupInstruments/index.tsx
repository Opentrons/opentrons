import { COLORS, ALIGN_CENTER, DIRECTION_COLUMN, Flex, JUSTIFY_SPACE_BETWEEN, SPACING, TYPOGRAPHY } from '@opentrons/components'
import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useAllPipetteOffsetCalibrationsQuery, useInstrumentsQuery } from '@opentrons/react-api-client'
import { BackButton } from '../../atoms/buttons'
import { ContinueButton } from '../ProtocolSetupModules' 
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolInstrumentMountItem } from '../InstrumentMountItem'

import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'

export interface ProtocolSetupInstrumentsProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ProtocolSetupInstruments({
  runId,
  setSetupScreen,
}: ProtocolSetupInstrumentsProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const { data: attachedInstruments } = useInstrumentsQuery()
  const { data: allPipettesCalibrationData } = useAllPipetteOffsetCalibrationsQuery()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%" gridGap={SPACING.spacing3}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <BackButton onClick={() => setSetupScreen('prepare to run')}>
          {t('instruments')}
        </BackButton>
        <Flex gridGap={SPACING.spacingXXL}>
          <ContinueButton onClick={() => setSetupScreen('modules')} />
        </Flex>
      </Flex>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        paddingX={SPACING.spacing5}
      >
        <ColumnLabel>{t('location')}</ColumnLabel>
        <ColumnLabel>{t('calibration')}</ColumnLabel>
      </Flex>
      {mostRecentAnalysis != null
        ? mostRecentAnalysis.pipettes.map(loadedPipette => {
          const attachedInstrument = (attachedInstruments?.data ?? []).find(i => i.mount === loadedPipette.mount) ?? null
          return (
            <ProtocolInstrumentMountItem
              key={loadedPipette.mount}
              mount={loadedPipette.mount}
              speccedName={loadedPipette.pipetteName}
              attachedInstrument={attachedInstrument}
              attachedCalibrationData={
                attachedInstrument != null
                  ? allPipettesCalibrationData?.data.find(cal => (cal.mount === attachedInstrument.mount && cal.pipette === attachedInstrument.instrumentName)) ?? null
                  : null
              } />
          )
        })
        : null
      }
    </Flex>
  )
}

const ColumnLabel = styled.p`
  flex: 1 0 auto;
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  font-size: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${COLORS.darkBlack_seventy};
`
