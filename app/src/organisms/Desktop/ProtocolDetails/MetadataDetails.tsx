import { Fragment } from 'react'
import omit from 'lodash/omit'
import startCase from 'lodash/startCase'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_WRAP_ANYWHERE,
  SPACING,
  StyledText,
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
    return <StyledText forwardedAs="p">{description}</StyledText>
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
        <StyledText forwardedAs="p" overflowWrap={OVERFLOW_WRAP_ANYWHERE}>
          {description}
        </StyledText>
        {filteredMetaData.map((item, index) => {
          return (
            <Fragment key={index}>
              <StyledText
                forwardedAs="h6"
                marginTop={SPACING.spacing8}
                color={COLORS.grey60}
              >
                {startCase(item.label)}
              </StyledText>
              <StyledText forwardedAs="p">{item.value}</StyledText>
            </Fragment>
          )
        })}
      </Flex>
    )
  }
}
