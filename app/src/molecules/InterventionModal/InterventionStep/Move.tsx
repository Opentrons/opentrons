import * as React from 'react'
import { css } from 'styled-components'

import {
  LocationIcon,
  Flex,
  Icon,
  COLORS,
  BORDERS,
  SPACING,
  DIRECTION_COLUMN,
  StyledText,
  ALIGN_CENTER,
} from '@opentrons/components'

import type { LocationIconProps } from '@opentrons/components'

export interface MoveProps {
  type: 'move' | 'refill' | 'select'
  labwareName: string
  currentLocationProps: LocationIconProps
  newLocationProps?: LocationIconProps
}

export function Move(props: MoveProps): JSX.Element {
  const content = buildContent(props)

  return (
    <Flex css={CARD_STYLE}>
      <StyledText as="pBold">{props.labwareName}</StyledText>
      {content}
    </Flex>
  )
}

const buildContent = (props: MoveProps): JSX.Element => {
  switch (props.type) {
    case 'move':
      return buildMove(props)
    case 'refill':
      return buildRefill(props)
    case 'select':
      return buildSelect(props)
  }
}

const buildMove = (props: MoveProps): JSX.Element => {
  const { currentLocationProps, newLocationProps } = props

  if (newLocationProps != null) {
    return (
      <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
        <LocationIcon {...currentLocationProps} />
        <Icon name="arrow-right" css={ICON_STYLE} />
        <LocationIcon {...newLocationProps} />
      </Flex>
    )
  } else {
    return buildRefill(props)
  }
}

const buildRefill = ({ currentLocationProps }: MoveProps): JSX.Element => {
  return (
    <Flex gridGap={SPACING.spacing8}>
      <LocationIcon {...currentLocationProps} />
    </Flex>
  )
}

const buildSelect = (props: MoveProps): JSX.Element => {
  const { currentLocationProps, newLocationProps } = props

  if (newLocationProps != null) {
    return (
      <Flex gridGap={SPACING.spacing8}>
        <LocationIcon {...currentLocationProps} />
        <Icon name="colon" css={ICON_STYLE} />
        <LocationIcon {...newLocationProps} />
      </Flex>
    )
  } else {
    return buildRefill(props)
  }
}

const ICON_STYLE = css`
  width: ${SPACING.spacing40};
  height: ${SPACING.spacing40};
`

const CARD_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  background-color: ${COLORS.grey35};
  width: 26.75rem;
  padding: ${SPACING.spacing16};
  grid-gap: ${SPACING.spacing8};
  border-radius: ${BORDERS.borderRadius8};
`
