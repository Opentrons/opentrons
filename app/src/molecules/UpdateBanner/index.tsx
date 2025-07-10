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
  updateType: 'calibration' | 'setup' | 'firmware'
  handleUpdateClick: () => void
  serialNumber: string
  isTooHot?: boolean
  attachPipetteRequired?: boolean
  calibratePipetteRequired?: boolean
  updatePipetteFWRequired?: boolean
  handleCloseClick?: () => void
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
  handleCloseClick,
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
    updateType === 'firmware'
      ? true
      : !isEstopNotDisengaged &&
        !isTooHot &&
        !attachPipetteRequired &&
        !calibratePipetteRequired &&
        !updatePipetteFWRequired

  const getMessage = (): string => {
    switch (updateType) {
      case 'calibration':
        return getCalibrationMessage()
      case 'firmware':
        return t('firmware_update_available')
      default:
        return t('setup_module_for_use')
    }
  }

  const getLinkText = (): string | undefined => {
    if (!canProceed) return undefined
    if (updateType === 'firmware') {
      return t('update_now')
    }
    return t('setup_module')
  }

  const isFlex = useIsFlex(robotName)
  // Only show banner for needing firmware update if robot is an OT-2
  if (!isFlex && updateType !== 'firmware') {
    return null
  }
  if (updateType === 'setup' && !canProceed) {
    return null
  }
  return (
    <Flex
      data-testid={`ModuleCard_${updateType}_update_banner_${serialNumber}`}
      {...targetProps}
    >
      <InlineNotification
        type={updateType === 'calibration' ? 'error' : 'alert'}
        message={getMessage()}
        linkText={getLinkText()}
        onLinkClick={handleUpdateClick}
        minWidth="12.625rem"
        onCloseClick={handleCloseClick}
      />
      {isTooHot ? (
        <Tooltip tooltipProps={tooltipProps}>
          {t('module_wizard_flows:module_too_hot')}
        </Tooltip>
      ) : null}
    </Flex>
  )
}
