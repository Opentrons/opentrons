import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_START,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  Btn,
  Flex,
} from '@opentrons/components'

import { Banner } from '../../atoms/Banner'

interface UpdateBannerProps {
  updateType: 'calibration' | 'firmware' | 'firmware_important'
  setShowBanner: (arg0: boolean) => void
  handleUpdateClick: () => void
  serialNumber: string
  attachPipetteRequired?: boolean
  updatePipetteFWRequired?: boolean
}

export const UpdateBanner = ({
  updateType,
  serialNumber,
  setShowBanner,
  handleUpdateClick,
  attachPipetteRequired,
  updatePipetteFWRequired,
}: UpdateBannerProps): JSX.Element => {
  const { t } = useTranslation('device_details')

  let bannerType: 'error' | 'warning'
  let bannerMessage: string
  let hyperlinkText: string
  let closeButtonRendered: false | undefined

  if (updateType === 'calibration') {
    bannerType = 'error'
    closeButtonRendered = false
    if (attachPipetteRequired)
      bannerMessage = t('module_calibration_required_no_pipette_attached')
    else if (updatePipetteFWRequired)
      bannerMessage = t('module_calibration_required_update_pipette_FW')
    else bannerMessage = t('module_calibration_required')
    hyperlinkText =
      !attachPipetteRequired && !updatePipetteFWRequired
        ? t('calibrate_now')
        : ''
  } else {
    bannerType = updateType === 'firmware' ? 'warning' : 'error'
    closeButtonRendered = updateType === 'firmware' ? undefined : false
    bannerMessage = t('firmware_update_available')
    hyperlinkText = t('update_now')
  }

  return (
    <Flex
      paddingBottom={SPACING.spacing4}
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      data-testid={`ModuleCard_${updateType}_update_banner_${serialNumber}`}
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
  )
}
