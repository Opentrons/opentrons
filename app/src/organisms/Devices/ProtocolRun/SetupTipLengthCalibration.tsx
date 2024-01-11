import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  LEGACY_COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import * as PipetteConstants from '../../../redux/pipettes/constants'
import { useRunPipetteInfoByMount } from '../hooks'
import { SetupCalibrationItem } from './SetupCalibrationItem'
import { SetupTipLengthCalibrationButton } from './SetupTipLengthCalibrationButton'
interface SetupTipLengthCalibrationProps {
  robotName: string
  runId: string
}

export function SetupTipLengthCalibration({
  robotName,
  runId,
}: SetupTipLengthCalibrationProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'devices_landing'])
  const runPipetteInfoByMount = useRunPipetteInfoByMount(runId)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      <StyledText
        color={LEGACY_COLORS.black}
        css={TYPOGRAPHY.pSemiBold}
        id="TipRackCalibration_requiredTipLengthTitle"
      >
        {t('required_tip_racks_title')}
      </StyledText>
      {PipetteConstants.PIPETTE_MOUNTS.map(mount => {
        const pipetteInfo = runPipetteInfoByMount[mount]
        if (pipetteInfo == null) {
          return null
        } else {
          return (
            <React.Fragment key={mount}>
              {pipetteInfo.tipRacksForPipette.map((tipRackInfo, index) => {
                const pipetteNotAttached =
                  pipetteInfo.requestedPipetteMatch === 'incompatible'
                return (
                  <SetupCalibrationItem
                    key={index}
                    calibratedDate={tipRackInfo.lastModifiedDate}
                    label={pipetteInfo.pipetteSpecs?.displayName}
                    title={tipRackInfo.displayName}
                    subText={
                      pipetteNotAttached
                        ? t('attach_pipette_tip_length_calibration')
                        : undefined
                    }
                    button={
                      <SetupTipLengthCalibrationButton
                        mount={mount}
                        disabled={pipetteNotAttached}
                        robotName={robotName}
                        runId={runId}
                        hasCalibrated={tipRackInfo.lastModifiedDate !== null}
                        tipRackDefinition={tipRackInfo.tipRackDef}
                        isExtendedPipOffset={false}
                      />
                    }
                    runId={runId}
                  />
                )
              })}
            </React.Fragment>
          )
        }
      })}
    </Flex>
  )
}
