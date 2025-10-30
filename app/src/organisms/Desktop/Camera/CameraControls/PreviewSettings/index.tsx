import { useTranslation } from 'react-i18next'

import { Icon, SecondaryButton, StyledText } from '@opentrons/components'

import { Skeleton } from '/app/atoms/Skeleton'

import { usePreviewImage } from './hooks/usePreviewImage'
import styles from './previewsettings.module.css'

export function PreviewSettings(): JSX.Element {
  const { isLoading, imgPath, takePhoto } = usePreviewImage()

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

function PreviewImage({
  imgPath,
}: {
  imgPath: string | undefined
}): JSX.Element {
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
        <Skeleton width="100%" height="100%" backgroundSize="47rem" />
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
}: PreviewImageBtnProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <SecondaryButton className={styles.preview_image_btn} onClick={onClick}>
      {isLoading ? (
        <Icon name="ot-spinner" spin className={styles.icon_style} />
      ) : (
        <Icon name="photo-camera" className={styles.icon_style} />
      )}
      <StyledText>
        {hasPreviewImg ? t('retake_preview') : t('preview_image')}
      </StyledText>
    </SecondaryButton>
  )
}
