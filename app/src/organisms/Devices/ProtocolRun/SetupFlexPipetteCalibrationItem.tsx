import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_ROW,
  SPACING,
  JUSTIFY_FLEX_END,
  WRAP,
} from '@opentrons/components'
import {
  getPipetteNameSpecs,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { TertiaryButton } from '../../../atoms/buttons'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { FLOWS } from '../../PipetteWizardFlows/constants'
import { SetupCalibrationItem } from './SetupCalibrationItem'
import type { PipetteData } from '@opentrons/api-client'
import type { LoadPipetteRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'
import type { Mount } from '../../../redux/pipettes/types'

interface SetupInstrumentCalibrationItemProps {
  mount: Mount
  runId: string
  instrumentsRefetch?: () => void
}

export function SetupFlexPipetteCalibrationItem({
  mount,
  runId,
  instrumentsRefetch,
}: SetupInstrumentCalibrationItemProps): JSX.Element | null {
  const { t } = useTranslation(['protocol_setup', 'devices_landing'])
  const [showFlexPipetteFlow, setShowFlexPipetteFlow] = React.useState<boolean>(
    false
  )
  const { data: attachedInstruments } = useInstrumentsQuery()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const loadPipetteCommand = mostRecentAnalysis?.commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === mount
  )
  const requestedPipette = mostRecentAnalysis?.pipettes?.find(
    pipette => pipette.id === loadPipetteCommand?.result?.pipetteId
  )

  if (requestedPipette == null) return null
  const requestedPipetteSpecs = getPipetteNameSpecs(
    requestedPipette.pipetteName
  )
  let button: JSX.Element | undefined
  let subText

  const attachedPipetteOnMount = attachedInstruments?.data?.find(
    (instrument): instrument is PipetteData =>
      instrument.ok && instrument.mount === mount
  )
  const requestedPipetteMatch =
    requestedPipette.pipetteName === attachedPipetteOnMount?.instrumentName
  const pipetteCalDate = requestedPipetteMatch
    ? attachedPipetteOnMount?.data.calibratedOffset?.last_modified ?? null
    : null
  let flowType = ''
  if (pipetteCalDate != null && requestedPipetteMatch) {
    button = undefined
  } else if (!requestedPipetteMatch) {
    subText = t('attach_pipette_calibration')
    flowType = FLOWS.ATTACH
    button = (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <TertiaryButton
          id="PipetteCalibration_attachPipetteButton"
          onClick={() => setShowFlexPipetteFlow(true)}
        >
          {t('attach_pipette_cta')}
        </TertiaryButton>
      </Flex>
    )
  } else {
    flowType = FLOWS.CALIBRATE
    button = (
      <>
        <Flex
          alignItems={ALIGN_CENTER}
          marginLeft={SPACING.spacing16}
          flexWrap={WRAP}
          justifyContent={JUSTIFY_FLEX_END}
          gridGap={SPACING.spacing8}
        >
          <TertiaryButton
            id="PipetteCalibration_calibratePipetteButton"
            onClick={() => setShowFlexPipetteFlow(true)}
          >
            {t('calibrate_now')}
          </TertiaryButton>
        </Flex>
      </>
    )
  }

  return (
    <>
      {showFlexPipetteFlow && (
        <PipetteWizardFlows
          flowType={flowType}
          mount={mount}
          closeFlow={() => setShowFlexPipetteFlow(false)}
          selectedPipette={
            requestedPipetteSpecs?.channels === 96
              ? NINETY_SIX_CHANNEL
              : SINGLE_MOUNT_PIPETTES
          }
          pipetteInfo={mostRecentAnalysis?.pipettes}
          onComplete={instrumentsRefetch}
        />
      )}
      <SetupCalibrationItem
        button={button}
        calibratedDate={pipetteCalDate}
        subText={subText}
        label={
          requestedPipetteSpecs?.channels === 96
            ? t('devices_landing:ninety_six_mount')
            : t(`devices_landing:${mount}_mount`)
        }
        title={requestedPipetteSpecs?.displayName}
        id={`PipetteCalibration_${mount}MountTitle`}
        runId={runId}
      />
    </>
  )
}
