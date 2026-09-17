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
  LegacyStyledText,
  SPACING,
  truncateString,
} from '@opentrons/components'

import type { ReactNode } from 'react'

const FILE_UPLOAD_STYLE = css`
&:hover > svg {
  background: ${COLORS.black90}${COLORS.opacity20HexCode};
}
&:active > svg {
  background: ${COLORS.black90}${COLORS.opacity20HexCode}};
}
`

const FILE_UPLOAD_FOCUS_VISIBLE = css`
  &:focus-visible {
    border-radius: ${BORDERS.borderRadius4};
    box-shadow: 0 0 0 ${SPACING.spacing2} ${COLORS.blue50};
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
}: FileUploadProps): ReactNode {
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Btn
        onClick={handleClick}
        aria-label="remove_file"
        css={FILE_UPLOAD_FOCUS_VISIBLE}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          backgroundColor={fileError == null ? COLORS.grey20 : COLORS.red30}
          borderRadius={BORDERS.borderRadius4}
          height={SPACING.spacing44}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing8}
          css={FILE_UPLOAD_STYLE}
        >
          <LegacyStyledText forwardedAs="p">
            {truncateString(file.name, 34, 19)}
          </LegacyStyledText>
          <Icon name="close" size="1.5rem" borderRadius="50%" />
        </Flex>
      </Btn>
      {fileError != null ? (
        <LegacyStyledText forwardedAs="label" color={COLORS.red50}>
          {fileError}
        </LegacyStyledText>
      ) : null}
    </Flex>
  )
}
