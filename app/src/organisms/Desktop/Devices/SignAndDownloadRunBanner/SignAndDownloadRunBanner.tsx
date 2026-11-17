import { useTranslation } from 'react-i18next'

import { InlineNotification } from '@opentrons/components'

import { useIsSigningOrDownloadingRequired } from '/app/resources/audit/useIsSigningOrDownloadingRequired'

import type { ReactNode } from 'react'

const COPY_BY_BANNER_TYPE = {
  signing: {
    messageKey: 'signature_required_description',
    linkTextKey: 'sign_now',
  },
  downloading: {
    messageKey: 'audit_log_download_required_description',
    linkTextKey: 'download_now',
  },
}

export interface SignAndDownloadRunBannerProps {
  robotName: string
}

export function SignAndDownloadRunBanner({
  robotName,
}: SignAndDownloadRunBannerProps): ReactNode {
  const { t } = useTranslation('access_control')

  const { isSigningRequired, isDownloadingRequired, onLinkClick } =
    useIsSigningOrDownloadingRequired(robotName)

  if (!isSigningRequired && !isDownloadingRequired) {
    return null
  }

  const bannerType = isSigningRequired ? 'signing' : 'downloading'
  const { messageKey, linkTextKey } = COPY_BY_BANNER_TYPE[bannerType]

  return (
    <InlineNotification
      type="alert"
      message={t(messageKey)}
      linkText={t(linkTextKey)}
      onLinkClick={onLinkClick}
    />
  )
}
