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
}: MetadataDetailsProps): JSX.Element {
  if (protocolType === 'json') {
    return <LegacyStyledText as="p">{description}</LegacyStyledText>
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
        <LegacyStyledText as="p" overflowWrap={OVERFLOW_WRAP_ANYWHERE}>
          {description}
        </LegacyStyledText>
        {filteredMetaData.map((item, index) => {
          return (
            <Fragment key={index}>
              <LegacyStyledText
                as="h6"
                marginTop={SPACING.spacing8}
                color={COLORS.grey60}
              >
                {startCase(item.label)}
              </LegacyStyledText>
              <LegacyStyledText as="p">{item.value}</LegacyStyledText>
            </Fragment>
          )
        })}
      </Flex>
    )
  }
}
