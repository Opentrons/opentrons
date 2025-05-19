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

  // If the message ends with a period, remove it because the InlineNotification
  // component adds a period to the end of the message. Removing the period in
  // the localized message is not an option because some messages are used in
  // multiple places and some of those places DO require a period.
  const formattedMessage = (): string => {
    const message = getMessage()
    if (message.slice(-1) === '.') {
      return message.slice(0, -1)
    }
    return message
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
  if (!isFlex && updateType !== 'firmware') return null
  return (
    <Flex
      data-testid={`ModuleCard_${updateType}_update_banner_${serialNumber}`}
      {...targetProps}
    >
      <InlineNotification
        type={updateType === 'calibration' ? 'error' : 'alert'}
        message={formattedMessage()}
        linkText={getLinkText()}
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
