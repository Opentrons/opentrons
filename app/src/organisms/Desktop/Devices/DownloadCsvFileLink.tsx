import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Flex,
  Icon,
  LegacyStyledText,
  Link,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { isFileSaveCanceledError } from '/app/local-resources/files/fileSaveCanceledError'
import { saveFileFromUrl } from '/app/redux/shell/remote'

interface DownloadCsvFileLinkProps {
  fileId: string
  fileName: string
}

export function DownloadCsvFileLink(
  props: DownloadCsvFileLinkProps
): JSX.Element {
  const { fileId, fileName } = props
  const { t } = useTranslation('run_details')
  const host = useHost()

  return (
    <Link
      role="button"
      css={
        host == null
          ? TYPOGRAPHY.darkLinkLabelSemiBoldDisabled
          : TYPOGRAPHY.linkPSemiBold
      }
      onClick={() => {
        if (host == null) {
          return
        }
        void saveFileFromUrl({
          name: fileName,
          source: `/dataFiles/${fileId}/download`,
          hostname: host.hostname,
          port: host.port ?? null,
        }).catch((error: unknown) => {
          if (!isFileSaveCanceledError(error)) {
            throw error
          }
        })
      }}
    >
      <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing4}>
        <LegacyStyledText forwardedAs="p">{t('download')}</LegacyStyledText>
        <Icon name="download" size="1rem" />
      </Flex>
    </Link>
  )
}
