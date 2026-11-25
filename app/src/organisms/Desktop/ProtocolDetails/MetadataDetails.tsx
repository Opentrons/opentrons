import { Fragment } from 'react'
import omit from 'lodash/omit'
import startCase from 'lodash/startCase'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  OVERFLOW_WRAP_ANYWHERE,
  SPACING,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export interface Metadata {
  [key: string]: any
}

interface MetadataDetailsProps {
  description: string
  metadata: Metadata
  protocolType: string
}

export function MetadataDetails({
  description,
  metadata,
  protocolType,
}: MetadataDetailsProps): ReactNode {
  if (protocolType === 'json') {
    return <LegacyStyledText forwardedAs="p">{description}</LegacyStyledText>
  } else {
    const filteredMetaData = Object.entries(
      omit(metadata, ['description', 'protocolName', 'author', 'apiLevel'])
    ).map(item => ({ label: item[0], value: item[1] }))

    return (
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        data-testid="ProtocolDetails_description"
      >
        <LegacyStyledText forwardedAs="p" overflowWrap={OVERFLOW_WRAP_ANYWHERE}>
          {description}
        </LegacyStyledText>
        {filteredMetaData.map((item, index) => {
          return (
            <Fragment key={index}>
              <LegacyStyledText
                forwardedAs="h6"
                marginTop={SPACING.spacing8}
                color={COLORS.grey60}
              >
                {startCase(item.label)}
              </LegacyStyledText>
              <LegacyStyledText forwardedAs="p">{item.value}</LegacyStyledText>
            </Fragment>
          )
        })}
      </Flex>
    )
  }
}
