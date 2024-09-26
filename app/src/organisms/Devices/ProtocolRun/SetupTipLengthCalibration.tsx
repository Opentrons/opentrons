import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import * as PipetteConstants from '/app/redux/pipettes/constants'
import { useRunPipetteInfoByMount } from '/app/resources/runs'
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
      <LegacyStyledText
        color={COLORS.black90}
        css={TYPOGRAPHY.pSemiBold}
        id="TipRackCalibration_requiredTipLengthTitle"
      >
        {t('required_tip_racks_title')}
      </LegacyStyledText>
      {PipetteConstants.PIPETTE_MOUNTS.map(mount => {
        const pipetteInfo = runPipetteInfoByMount[mount]
        if (pipetteInfo == null) {
          return null
        } else {
          return (
            <Fragment key={mount}>
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
            </Fragment>
          )
        }
      })}
    </Flex>
  )
}
