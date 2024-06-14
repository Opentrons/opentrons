import React from 'react'
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
  truncateString,
} from '@opentrons/components'
import type { CsvFileParameter, RunTimeParameter } from '@opentrons/shared-data'

interface FileCardProps {
  error: string | null
  fileRunTimeParameter: CsvFileParameter
  runTimeParametersOverrides: RunTimeParameter[]
  setRunTimeParametersOverrides?: (rtpOverrides: RunTimeParameter[]) => void
}

export function FileCard(props: FileCardProps): JSX.Element {
  const {
    error,
    fileRunTimeParameter,
    runTimeParametersOverrides,
    setRunTimeParametersOverrides,
  } = props

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="100%"
    >
      <Flex
        height="2.75rem"
        padding={SPACING.spacing8}
        backgroundColor={error == null ? COLORS.grey20 : COLORS.red30}
        borderRadius={BORDERS.borderRadius4}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <StyledText
          as="p"
          css={css`
            overflow: hidden;
            white-space: nowrap;
          `}
        >
          {truncateString(fileRunTimeParameter?.file?.file?.name ?? '', 35, 18)}
        </StyledText>
        <Flex alignItems={ALIGN_CENTER}>
          <Btn
            data-testid="close_button"
            size="1.5625rem"
            onClick={() => {
              const clone = runTimeParametersOverrides.map((parameter, i) => {
                if (
                  fileRunTimeParameter.variableName ===
                    parameter.variableName &&
                  parameter.type === 'csv_file'
                ) {
                  return {
                    ...parameter,
                    file: null,
                  }
                }
                return parameter
              })
              setRunTimeParametersOverrides?.(clone)
            }}
          >
            <Icon
              name="close"
              css={css`
                border-radius: ${BORDERS.borderRadius4};
                &:hover {
                  background: ${error == null ? COLORS.grey40 : COLORS.red40};
                }
              `}
            />
          </Btn>
        </Flex>
      </Flex>
      {error != null ? (
        <StyledText as="label" color={COLORS.red50}>
          {error}
        </StyledText>
      ) : null}
    </Flex>
  )
}
