// TODO: replace this by making these props true of interventionmodal content wrappers
// once error recovery uses interventionmodal consistently

import type * as React from 'react'
import { css } from 'styled-components'
import {
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  Flex,
  RESPONSIVENESS,
} from '@opentrons/components'
import type { StyleProps } from '@opentrons/components'
import {
  OneColumn,
  TwoColumn,
  OneColumnOrTwoColumn,
} from '/app/molecules/InterventionModal'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

interface SingleColumnContentWrapperProps {
  children: React.ReactNode
  footerDetails?: React.ComponentProps<typeof RecoveryFooterButtons>
}

interface TwoColumnContentWrapperProps {
  children: [React.ReactNode, React.ReactNode]
  footerDetails?: React.ComponentProps<typeof RecoveryFooterButtons>
}

interface OneOrTwoColumnContentWrapperProps {
  children: [React.ReactNode, React.ReactNode]
  footerDetails?: React.ComponentProps<typeof RecoveryFooterButtons>
}
// For flex-direction: column recovery content with one column only.
export function RecoverySingleColumnContentWrapper({
  children,
  footerDetails,
  ...styleProps
}: SingleColumnContentWrapperProps & StyleProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      css={STYLE}
      {...styleProps}
    >
      <OneColumn css={STYLE} {...styleProps}>
        {children}
      </OneColumn>
      {footerDetails != null ? (
        <RecoveryFooterButtons {...footerDetails} />
      ) : null}
    </Flex>
  )
}

// For two-column recovery content
export function RecoveryTwoColumnContentWrapper({
  children,
  footerDetails,
}: TwoColumnContentWrapperProps): JSX.Element {
  const [leftChild, rightChild] = children
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      css={STYLE}
    >
      <TwoColumn css={STYLE}>
        {leftChild}
        {rightChild}
      </TwoColumn>
      {footerDetails != null ? (
        <RecoveryFooterButtons {...footerDetails} />
      ) : null}
    </Flex>
  )
}

// For recovery content with one column on ODD and two columns on desktop
export function RecoveryODDOneDesktopTwoColumnContentWrapper({
  children: [leftOrSingleElement, optionallyShownRightElement],
  footerDetails,
}: OneOrTwoColumnContentWrapperProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      width="100%"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <OneColumnOrTwoColumn css={STYLE}>
        {leftOrSingleElement}
        {optionallyShownRightElement}
      </OneColumnOrTwoColumn>
      {footerDetails != null ? (
        <RecoveryFooterButtons {...footerDetails} />
      ) : null}
    </Flex>
  )
}

const STYLE = css`
  gap: ${SPACING.spacing24};
  width: 100%;
  height: 100%;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    gap: 0;
  }
`
