import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  NewPrimaryBtn,
  Tooltip,
  useHoverTooltip,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { useTrackEvent } from '../../../redux/analytics'
import { ConfirmAttachmentModal } from '../../Devices/ModuleCard/ConfirmAttachmentModal'
import { useHeaterShakerFromProtocol } from '../../Devices/ModuleCard/hooks'
import { useModuleMatchResults, useProtocolCalibrationStatus } from './hooks'

export const ProceedToRunCta = (): JSX.Element | null => {
  const { t } = useTranslation('protocol_setup')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const moduleMatchResults = useModuleMatchResults()
  const trackEvent = useTrackEvent()
  const heaterShaker = useHeaterShakerFromProtocol()
  const isHeaterShakerInProtocol = heaterShaker != null
  const isEverythingCalibrated = useProtocolCalibrationStatus().complete
  const { missingModuleIds } = moduleMatchResults
  const calibrationIncomplete =
    missingModuleIds.length === 0 && !isEverythingCalibrated
  const moduleSetupIncomplete =
    missingModuleIds.length > 0 && isEverythingCalibrated
  const moduleAndCalibrationIncomplete =
    missingModuleIds.length > 0 && !isEverythingCalibrated
  const [
    showConfirmAttachModal,
    setShowConfirmAttachmentModal,
  ] = React.useState<boolean>(false)

  let proceedToRunDisabledReason = null
  if (moduleAndCalibrationIncomplete) {
    proceedToRunDisabledReason = t(
      'run_disabled_modules_and_calibration_not_complete'
    )
  } else if (calibrationIncomplete) {
    proceedToRunDisabledReason = t('run_disabled_calibration_not_complete')
  } else if (moduleSetupIncomplete) {
    proceedToRunDisabledReason = t('run_disabled_modules_not_connected')
  }
  const buttonInsteadOfNavLink =
    isHeaterShakerInProtocol || proceedToRunDisabledReason != null

  const LinkComponent = buttonInsteadOfNavLink ? 'button' : NavLink
  const linkProps = buttonInsteadOfNavLink ? {} : { to: '/run' }

  return (
    <Flex justifyContent={JUSTIFY_CENTER}>
      {showConfirmAttachModal && (
        <ConfirmAttachmentModal
          onCloseClick={() => setShowConfirmAttachmentModal(false)}
          isProceedToRunModal={true}
          shakerValue={null}
        />
      )}
      <NewPrimaryBtn
        role="button"
        title={t('proceed_to_run')}
        disabled={proceedToRunDisabledReason != null}
        as={LinkComponent}
        id={'LabwareSetup_proceedToRunButton'}
        onClick={
          isHeaterShakerInProtocol
            ? () => setShowConfirmAttachmentModal(true)
            : () => trackEvent({ name: 'proceedToRun', properties: {} })
        }
        {...linkProps}
        {...targetProps}
      >
        {t('proceed_to_run')}
      </NewPrimaryBtn>
      {proceedToRunDisabledReason != null && (
        <Tooltip {...tooltipProps}>{proceedToRunDisabledReason}</Tooltip>
      )}
    </Flex>
  )
}
