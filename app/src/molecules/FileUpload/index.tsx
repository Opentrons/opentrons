import * as React from 'react'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'

const CLOSE_ICON_STYLE = css`
  border-radius: 50%;

  &:hover {
    background: ${COLORS.black90}${COLORS.opacity20HexCode};
  }
  &:active {
    background: ${COLORS.black90}${COLORS.opacity20HexCode}};
  }
`

interface FileUploadProps {
  file: File
  fileError: string | null
  handleClick: () => unknown
}

export function FileUpload({
  file,
  fileError,
  handleClick,
}: FileUploadProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={fileError == null ? COLORS.grey20 : COLORS.red30}
        borderRadius={BORDERS.borderRadius4}
        height={SPACING.spacing44}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        padding={SPACING.spacing8}
      >
        <StyledText as="p">{file.name}</StyledText>
        <Btn
          size="1.5rem"
          onClick={handleClick}
          css={CLOSE_ICON_STYLE}
          aria-label="remove_file"
        >
          <Icon name="close" />
        </Btn>
      </Flex>
      {fileError != null ? (
        <StyledText as="label" color={COLORS.red50}>
          {fileError}
        </StyledText>
      ) : null}
    </Flex>
  )
}
