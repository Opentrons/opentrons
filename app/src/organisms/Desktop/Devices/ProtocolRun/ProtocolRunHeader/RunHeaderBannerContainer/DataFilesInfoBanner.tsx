import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Banner,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  StyledText,
  TEXT_DECORATION_UNDERLINE,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export interface DataFilesInfoBannerProps {
  hasImages: boolean
  hasCsvFiles: boolean
  robotName: string
}

export function DataFilesInfoBanner({
  hasCsvFiles,
  hasImages,
  robotName,
}: DataFilesInfoBannerProps): ReactNode {
  const navigate = useNavigate()
  const { t } = useTranslation('run_details')

  const buildHeaderText = (): string => {
    if (hasImages) {
      return t('download_image_files')
    } else {
      return t('download_files')
    }
  }

  const buildBannerText = (): string => {
    if (hasCsvFiles && hasImages) {
      return t('all_available_download')
    } else if (hasImages) {
      return t('images_available_download')
    } else {
      return t('csv_available_download')
    }
  }

  return (
    <Banner type="informing">
      <Flex
        width="100%"
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            desktopStyle="captionSemiBold"
            marginBottom={SPACING.spacing4}
          >
            {buildHeaderText()}
          </StyledText>
          <StyledText desktopStyle="captionRegular">
            {buildBannerText()}
          </StyledText>
        </Flex>
        <Link
          textDecoration={TEXT_DECORATION_UNDERLINE}
          onClick={() => {
            navigate(`/devices/${robotName}/#recent-protocol-runs`)
          }}
        >
          {t('view_recent_runs')}
        </Link>
      </Flex>
    </Banner>
  )
}
