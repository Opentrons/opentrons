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
import { useCsvFileRawQuery } from '@opentrons/react-api-client'
import { downloadFile } from './utils'

interface DownloadCsvFileLinkProps {
  fileId: string
  fileName: string
}
export function DownloadCsvFileLink(
  props: DownloadCsvFileLinkProps
): JSX.Element {
  const { fileId, fileName } = props
  const { t } = useTranslation('run_details')
  const { data: csvFileRaw } = useCsvFileRawQuery(fileId)

  return (
    <Link
      role="button"
      css={
        csvFileRaw == null
          ? TYPOGRAPHY.darkLinkLabelSemiBoldDisabled
          : TYPOGRAPHY.linkPSemiBold
      }
      onClick={() => {
        if (csvFileRaw != null) {
          downloadFile(csvFileRaw, fileName)
        }
      }}
    >
      <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing4}>
        <LegacyStyledText as="p">{t('download')}</LegacyStyledText>
        <Icon name="download" size="1rem" />
      </Flex>
    </Link>
  )
}
