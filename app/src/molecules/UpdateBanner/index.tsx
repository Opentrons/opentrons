import { useTranslation } from 'react-i18next'

import {
  Flex,
  InlineNotification,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import { useIsFlex } from '/app/redux-resources/robots'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'

interface UpdateBannerProps {
  robotName: string
  updateType: 'calibration' | 'setup'
  handleUpdateClick: () => void
  serialNumber: string
  isTooHot?: boolean
  attachPipetteRequired?: boolean
  calibratePipetteRequired?: boolean
  updatePipetteFWRequired?: boolean
}

export const UpdateBanner = ({
  robotName,
  updateType,
  serialNumber,
  handleUpdateClick,
  attachPipetteRequired,
  calibratePipetteRequired,
  updatePipetteFWRequired,
  isTooHot,
}: UpdateBannerProps): JSX.Element | null => {
  const { t } = useTranslation(['device_details', 'module_wizard_flows'])
  const [targetProps, tooltipProps] = useHoverTooltip({ placement: 'top' })

  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)

  const getCalibrationMessage = (): string => {
    if (attachPipetteRequired) {
      return t('module_calibration_required_no_pipette_attached')
    }
    if (calibratePipetteRequired) {
      return t('module_calibration_required_no_pipette_calibrated')
    }
    if (updatePipetteFWRequired) {
      return t('module_calibration_required_update_pipette_FW')
    }
    return t('module_calibration_required')
  }

  const canProceed =
    updateType === 'calibration'
      ? !isEstopNotDisengaged &&
        !isTooHot &&
        !attachPipetteRequired &&
        !calibratePipetteRequired &&
        !updatePipetteFWRequired
      : true

  const message =
    updateType === 'calibration'
      ? getCalibrationMessage()
      : t('setup_module_for_use')

  const isFlex = useIsFlex(robotName)
  if (!isFlex && updateType === 'calibration') return null
  return (
    <Flex
      data-testid={`ModuleCard_${updateType}_update_banner_${serialNumber}`}
      {...targetProps}
    >
      <InlineNotification
        type={updateType === 'setup' ? 'alert' : 'error'}
        message={message}
        linkText={canProceed ? t('setup_module') : undefined}
        onLinkClick={handleUpdateClick}
        minWidth="12.625rem"
      />
      {isTooHot ? (
        <Tooltip tooltipProps={tooltipProps}>
          {t('module_wizard_flows:module_too_hot')}
        </Tooltip>
      ) : null}
    </Flex>
  )
}
