import { StyledText } from '@opentrons/components'

import styles from './gallery.module.css'

import type { UseStubImagesInfoResult } from './hooks/useStubImagesInfo'

export function GalleryItemCard({
  imagePath,
  stepCommandText,
  previousStepCommandText,
  timestamp,
}: UseStubImagesInfoResult): JSX.Element {
  return (
    <div className={styles.gallery_card}>
      <div className={styles.gallery_card_thumbnail}>
        <img
          className={styles.gallery_img}
          src={imagePath}
          alt="camera-photo"
        />
      </div>
      <div className={styles.gallery_card_cmd_txt_container}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {stepCommandText}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.gallery_cmd_txt_subtext}
        >
          {previousStepCommandText}
        </StyledText>
      </div>
      <div className={styles.gallery_card_timestamp}>
        <StyledText desktopStyle="bodyDefaultRegular">{timestamp}</StyledText>
      </div>
    </div>
  )
}
