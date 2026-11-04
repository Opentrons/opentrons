import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { InlineNotification } from '@opentrons/components'

import {
  selectIsAnyOffsetHardCoded,
  selectIsDefaultOffsetAbsent,
  selectSelectedLwOverview,
  selectShowDefaultOffsetInfoBanner,
  toggleDefaultOffsetInfoBanner,
} from '/app/redux/protocol-runs'

import type { ReactNode } from 'react'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

type RenderedBanner = 'defaultInfo' | 'defaultAlert' | 'hardcodedInfo' | null

export function OffsetBannerContainer({
  runId,
}: LPCWizardContentProps): ReactNode {
  const { t } = useTranslation('labware_position_check')
  const dispatch = useDispatch()
  const selectedLwInfo = useSelector(selectSelectedLwOverview(runId))
  const uri = selectedLwInfo?.uri ?? ''
  const isDefaultOffsetAbsent = useSelector(
    selectIsDefaultOffsetAbsent(runId, uri)
  )
  const isAnyOffsetHardCoded = useSelector(
    selectIsAnyOffsetHardCoded(runId, uri)
  )
  const showDefaultInfoBanner = useSelector(
    selectShowDefaultOffsetInfoBanner(runId)
  )

  const bannerToRender = ((): RenderedBanner => {
    if (isDefaultOffsetAbsent) {
      return 'defaultAlert'
    }

    if (showDefaultInfoBanner) {
      return 'defaultInfo'
    }

    if (isAnyOffsetHardCoded) {
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
        />
      )}
      {bannerToRender === 'defaultInfo' && (
        <InlineNotification
          type="neutral"
          heading={t('default_offset_description')}
          onCloseClick={() => {
            dispatch(toggleDefaultOffsetInfoBanner(runId))
          }}
        />
      )}
      {bannerToRender === 'hardcodedInfo' && (
        <InlineNotification
          type="neutral"
          heading={t('changing_default_not_update_hardcoded')}
          message={t('hardcoded_offsets_changed_in_python')}
        />
      )}
    </>
  )
}
