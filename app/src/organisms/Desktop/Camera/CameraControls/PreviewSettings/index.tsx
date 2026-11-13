import { useTranslation } from 'react-i18next'

import { Icon, SecondaryButton, StyledText } from '@opentrons/components'
import { type DocumentationState } from '@opentrons/react-api-client'

import { usePreviewImage } from '/app/resources/camera/usePreviewImage'

import styles from './previewsettings.module.css'

import type { ReactNode } from 'react'
import type { CameraImageSettings } from '@opentrons/api-client'

interface PreviewSettingsProps {
  settings: CameraImageSettings
  runId: string | null
  documentationState: DocumentationState
}

export function PreviewSettings({
  settings,
  runId,
  documentationState,
}: PreviewSettingsProps): ReactNode {
  const { isLoading, imgPath, takePhoto } = usePreviewImage(
    settings,
    runId,
    documentationState
  )

  return (
    <div className={styles.container}>
      <div className={styles.content_container}>
        <PreviewImage imgPath={imgPath} />
        <PreviewImageBtn
          hasPreviewImg={imgPath != null}
          onClick={takePhoto}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}

function PreviewImage({ imgPath }: { imgPath: string | null }): ReactNode {
  const { t } = useTranslation('device_settings')

  if (imgPath != null) {
    return (
      <img
        className={styles.preview_image}
        src={imgPath}
        alt="camera-settings-capture"
      />
    )
  } else {
    return (
      <div className={styles.no_image_container}>
        <Icon name="ot-alert" className={styles.no_image_alert} />
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('no_image_available')}
        </StyledText>
      </div>
    )
  }
}

interface PreviewImageBtnProps {
  onClick: () => void
  isLoading: boolean
  hasPreviewImg: boolean
}

function PreviewImageBtn({
  isLoading,
  onClick,
  hasPreviewImg,
}: PreviewImageBtnProps): ReactNode {
  const { t } = useTranslation('device_settings')

  return (
    <SecondaryButton className={styles.preview_image_btn} onClick={onClick}>
      {isLoading ? (
        <Icon name="ot-spinner" spin className={styles.icon_style} />
      ) : (
        <Icon name="camera" className={styles.icon_style} />
      )}
      <StyledText>
        {hasPreviewImg ? t('retake_preview') : t('preview_image')}
      </StyledText>
    </SecondaryButton>
  )
}
