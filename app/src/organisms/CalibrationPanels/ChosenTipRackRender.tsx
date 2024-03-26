import * as React from 'react'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  Box,
  DIRECTION_ROW,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
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
      marginLeft={SPACING.spacing8}
    >
      <img
        css={css`
          max-width: 7rem;
          max-height: 3.7rem;
        `}
        src={imageSrc}
        alt={`${String(displayName)} image`}
      />
      <Box>
        <StyledText as="p" marginLeft={SPACING.spacing16}>
          {displayName}
        </StyledText>
      </Box>
    </Flex>
  )
}
