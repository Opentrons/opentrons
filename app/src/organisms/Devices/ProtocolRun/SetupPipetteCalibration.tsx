import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'

import * as PipetteConstants from '../../../redux/pipettes/constants'
import { StyledText } from '../../../atoms/text'
import { useRunPipetteInfoByMount } from '../hooks'
import { SetupPipetteCalibrationItem } from './SetupPipetteCalibrationItem'

interface SetupPipetteCalibrationProps {
  robotName: string
  runId: string
}

export function SetupPipetteCalibration({
  robotName,
  runId,
}: SetupPipetteCalibrationProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const runPipetteInfoByMount = useRunPipetteInfoByMount(runId)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
      <StyledText
        color={COLORS.black}
        css={TYPOGRAPHY.pSemiBold}
        id="PipetteCalibration_requiredPipettesTitle"
      >
        {t('required_pipettes_title')}
      </StyledText>
      {PipetteConstants.PIPETTE_MOUNTS.map((mount, index) => {
        const pipetteInfo = runPipetteInfoByMount[mount]
        return pipetteInfo != null ? (
          <SetupPipetteCalibrationItem
            key={index}
            pipetteInfo={pipetteInfo}
            index={index}
            mount={mount}
            robotName={robotName}
            runId={runId}
          />
        ) : null
      })}
    </Flex>
  )
}
