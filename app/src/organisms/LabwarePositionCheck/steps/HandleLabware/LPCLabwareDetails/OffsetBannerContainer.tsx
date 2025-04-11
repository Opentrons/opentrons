import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  selectIsAnyOffsetHardCoded,
  selectIsDefaultOffsetAbsent,
  selectSelectedLwOverview,
} from '/app/redux/protocol-runs'
import { InlineNotification } from '/app/atoms/InlineNotification'
import { getIsOnDevice } from '/app/redux/config'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

type RenderedBanner = 'defaultInfo' | 'defaultAlert' | 'hardcodedInfo' | null

export function OffsetBannerContainer({
  bannerUtils,
  runId,
}: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')

  const {
    showBanner: showDefaultInfoBanner,
    toggleBanner: toggleDefaultInfoBanner,
  } = bannerUtils.defaultOffsetInfoBanner
  const isOnDevice = useSelector(getIsOnDevice)
  const selectedLwInfo = useSelector(selectSelectedLwOverview(runId))
  const uri = selectedLwInfo?.uri ?? ''
  const isDefaultOffsetAbsent = useSelector(
    selectIsDefaultOffsetAbsent(runId, uri)
  )
  const isAnyOffsetHardCoded = useSelector(
    selectIsAnyOffsetHardCoded(runId, uri)
  )

  const [showDefaultAlertBanner, setShowDefaultAlertBanner] = useState(
    isDefaultOffsetAbsent
  )
  const [showHardCodedBanner, setShowHardCodedBanner] = useState(
    isAnyOffsetHardCoded
  )

  const bannerToRender = ((): RenderedBanner => {
    if (showDefaultAlertBanner) {
      return 'defaultAlert'
    }

    if (showDefaultInfoBanner) {
      return 'defaultInfo'
    }

    if (showHardCodedBanner) {
      return 'hardcodedInfo'
    }

    return null
  })()

  return (
    <>
      {bannerToRender === 'defaultAlert' && (
        <InlineNotification
          type="alert"
          heading={t('add_a_default_offset')}
          message={t('specific_slots_can_be_adjusted')}
          onCloseClick={
            isOnDevice
              ? undefined
              : () => {
                  setShowDefaultAlertBanner(false)
                }
          }
        />
      )}
      {bannerToRender === 'defaultInfo' && (
        <InlineNotification
          type="neutral"
          heading={t('default_offset_description')}
          onCloseClick={toggleDefaultInfoBanner}
        />
      )}
      {bannerToRender === 'hardcodedInfo' && (
        <InlineNotification
          type="neutral"
          heading={t('changing_default_not_update_hardcoded')}
          message={t('hardcoded_offsets_changed_in_python')}
          onCloseClick={
            isOnDevice
              ? undefined
              : () => {
                  setShowHardCodedBanner(false)
                }
          }
        />
      )}
    </>
  )
}
