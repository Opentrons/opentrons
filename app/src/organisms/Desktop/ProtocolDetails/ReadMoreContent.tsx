import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import isEmpty from 'lodash/isEmpty'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  Link,
  OVERFLOW_WRAP_ANYWHERE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { MetadataDetails } from './MetadataDetails'

import type { ReactNode } from 'react'
import type { Metadata } from './MetadataDetails'

interface ReadMoreContentProps {
  metadata: Metadata
  protocolType: 'json' | 'python'
}

export function ReadMoreContent({
  metadata,
  protocolType,
}: ReadMoreContentProps): ReactNode {
  const { t, i18n } = useTranslation('protocol_details')
  const [isReadMore, setIsReadMore] = useState(true)

  const description = isEmpty(metadata.description)
    ? t('shared:no_data')
    : metadata.description

  return (
    <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing16}>
      {isReadMore ? (
        <LegacyStyledText forwardedAs="p" overflowWrap={OVERFLOW_WRAP_ANYWHERE}>
          {description.slice(0, 160)}
        </LegacyStyledText>
      ) : (
        <MetadataDetails
          description={description}
          metadata={metadata}
          protocolType={protocolType}
        />
      )}
      {(description.length > 160 || protocolType === 'python') && (
        <Link
          role="button"
          css={[TYPOGRAPHY.linkPSemiBold, `margin-top: ${SPACING.spacing8}`]}
          onClick={() => {
            setIsReadMore(!isReadMore)
          }}
        >
          {isReadMore
            ? i18n.format(t('read_more'), 'capitalize')
            : i18n.format(t('read_less'), 'capitalize')}
        </Link>
      )}
    </Flex>
  )
}
