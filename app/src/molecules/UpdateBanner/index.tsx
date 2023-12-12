import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_START,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  Btn,
  useHoverTooltip,
  Flex,
} from '@opentrons/components'

import { Banner } from '../../atoms/Banner'
import { Tooltip } from '../../atoms/Tooltip'
import { useIsFlex } from '../../organisms/Devices/hooks'

interface UpdateBannerProps {
  robotName: string
  updateType: 'calibration' | 'firmware' | 'firmware_important'
  setShowBanner: (arg0: boolean) => void
  handleUpdateClick: () => void
  serialNumber: string
  isTooHot?: boolean
  attachPipetteRequired?: boolean
  updatePipetteFWRequired?: boolean
}

export const UpdateBanner = ({
  robotName,
  updateType,
  serialNumber,
  setShowBanner,
  handleUpdateClick,
  attachPipetteRequired,
  updatePipetteFWRequired,
  isTooHot,
}: UpdateBannerProps): JSX.Element | null => {
  const { t } = useTranslation(['device_details', 'module_wizard_flows'])
  const [targetProps, tooltipProps] = useHoverTooltip({ placement: 'top' })
  let bannerType: 'error' | 'warning' | 'informing'
  let bannerMessage: string
  let hyperlinkText: string
  let closeButtonRendered: false | undefined

  if (updateType === 'calibration') {
    bannerType = isTooHot ? 'informing' : 'error'
    closeButtonRendered = false
    if (attachPipetteRequired)
      bannerMessage = t('module_calibration_required_no_pipette_attached')
    else if (updatePipetteFWRequired)
      bannerMessage = t('module_calibration_required_update_pipette_FW')
    else bannerMessage = t('module_calibration_required')
    hyperlinkText =
      !attachPipetteRequired && !updatePipetteFWRequired && !isTooHot
        ? t('calibrate_now')
        : ''
  } else {
    bannerType = updateType === 'firmware' ? 'warning' : 'error'
    closeButtonRendered = updateType === 'firmware' ? undefined : false
    bannerMessage = t('firmware_update_available')
    hyperlinkText = t('update_now')
  }

  const isFlex = useIsFlex(robotName)
  if (!isFlex && updateType === 'calibration') return null

  return (
    <>
      <Flex
        paddingBottom={SPACING.spacing4}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        data-testid={`ModuleCard_${updateType}_update_banner_${serialNumber}`}
        {...targetProps}
      >
        <Banner
          type={bannerType}
          onCloseClick={() => setShowBanner(false)}
          closeButton={closeButtonRendered}
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            {bannerMessage}
            <Btn
              textAlign={ALIGN_START}
              fontSize={TYPOGRAPHY.fontSizeP}
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              onClick={() => handleUpdateClick()}
            >
              {hyperlinkText}
            </Btn>
          </Flex>
        </Banner>
      </Flex>
      {isTooHot ? (
        <Tooltip tooltipProps={tooltipProps}>
          {t('module_wizard_flows:module_too_hot')}
        </Tooltip>
      ) : null}
    </>
  )
}
