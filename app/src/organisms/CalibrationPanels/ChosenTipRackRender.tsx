import * as React from 'react'
import { css } from 'styled-components'
import {
  Box,
  Flex,
  ALIGN_CENTER,
  DIRECTION_ROW,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { labwareImages } from './labwareImages'

import type { SelectOption } from '@opentrons/components'
export interface ChosenTipRackRenderProps {
  selectedValue: SelectOption
}

export function ChosenTipRackRender(
  props: ChosenTipRackRenderProps
): JSX.Element {
  const { selectedValue } = props
  const loadName: keyof typeof labwareImages = selectedValue.value.split(
    '/'
  )[1] as any
  const displayName = selectedValue?.label
  const imageSrc =
    loadName in labwareImages
      ? labwareImages[loadName]
      : labwareImages.generic_custom_tiprack

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      marginLeft={SPACING.spacing3}
    >
      <img
        css={css`
          max-width: 7rem;
          max-height: 3.7rem;
        `}
        src={imageSrc}
        alt={`${displayName} image`}
      />
      <Box>
        <StyledText as="p" marginLeft={SPACING.spacing4}>
          {displayName}
        </StyledText>
      </Box>
    </Flex>
  )
}
