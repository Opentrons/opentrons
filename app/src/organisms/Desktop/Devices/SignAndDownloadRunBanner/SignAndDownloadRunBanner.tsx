import { useTranslation } from 'react-i18next'

import { InlineNotification } from '@opentrons/components'

import { useIsSigningOrDownloadingRequired } from '/app/resources/audit/useIsSigningOrDownloadingRequired'

const COPY_BY_BANNER_TYPE = {
  signing: {
    headingKey: 'signature_required',
    messageKey: 'signature_required_description',
    linkTextKey: 'sign_now',
  },
  downloading: {
    headingKey: 'audit_log_download_required',
    messageKey: 'audit_log_download_required_description',
    linkTextKey: 'download_now',
  },
}

export interface SignAndDownloadRunBannerProps {
  robotName: string
}

export function SignAndDownloadRunBanner({
  robotName,
}: SignAndDownloadRunBannerProps): JSX.Element {
  const { t } = useTranslation('access_control')

  const { isSigningRequired, isDownloadingRequired, onLinkClick } =
    useIsSigningOrDownloadingRequired(robotName)

  if (!isSigningRequired && !isDownloadingRequired) {
    return <></>
  }

  const bannerType = isSigningRequired ? 'signing' : 'downloading'
  const { headingKey, messageKey, linkTextKey } =
    COPY_BY_BANNER_TYPE[bannerType]

  return (
    <InlineNotification
      type="alert"
      heading={t(headingKey)}
      message={t(messageKey)}
      linkText={t(linkTextKey)}
      onLinkClick={onLinkClick}
    />
  )
}
