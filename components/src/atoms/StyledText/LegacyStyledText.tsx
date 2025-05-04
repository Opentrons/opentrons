import { css } from '@emotion/react' // Import css from @emotion/react
import styled from '@emotion/styled' // Import styled from @emotion/styled

import { Text } from '../../primitives'
import { RESPONSIVENESS, TYPOGRAPHY } from '../../ui-style-constants'

import type { SerializedStyles } from '@emotion/react' // Import SerializedStyles from @emotion/react
import type { ComponentProps, FC, ReactNode } from 'react'

// export interface LegacyProps extends ComponentProps<typeof Text> {
//   children?: ReactNode
// }

// const styleMap: { [tag: string]: FlattenSimpleInterpolation } = {
const styleMap: { [tag: string]: SerializedStyles } = {
  // Update type to SerializedStyles
  h1: css`
    // css usage remains the same
    ${TYPOGRAPHY.h1Default}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.level1Header};
    }
  `,
  h2: css`
    ${TYPOGRAPHY.h2Regular}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.level2HeaderRegular};
    }
  `,
  h3: css`
    ${TYPOGRAPHY.h3Regular}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.level3HeaderRegular};
    }
  `,
  h4: css`
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.level4HeaderRegular};
    }
  `,
  h6: TYPOGRAPHY.h6Default,
  p: css`
    ${TYPOGRAPHY.pRegular}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.bodyTextRegular}
    }
  `,
  label: css`
    ${TYPOGRAPHY.labelRegular}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.smallBodyTextRegular}
    }
  `,
  h2SemiBold: css`
    ${TYPOGRAPHY.h2SemiBold}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.level2HeaderSemiBold}
    }
  `,
  h3SemiBold: css`
    ${TYPOGRAPHY.h3SemiBold}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.level3HeaderSemiBold}
    }
  `,
  h4SemiBold: TYPOGRAPHY.level4HeaderSemiBold,
  h6SemiBold: TYPOGRAPHY.h6SemiBold,
  pSemiBold: css`
    ${TYPOGRAPHY.pSemiBold}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.bodyTextSemiBold}
    }
  `,
  labelSemiBold: css`
    ${TYPOGRAPHY.labelSemiBold}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      font-size: ${TYPOGRAPHY.fontSize20};
      line-height: ${TYPOGRAPHY.lineHeight24};
    }
  `,
  h2Bold: TYPOGRAPHY.level2HeaderBold,
  h3Bold: TYPOGRAPHY.level3HeaderBold,
  h4Bold: TYPOGRAPHY.level4HeaderBold,
  pBold: TYPOGRAPHY.bodyTextBold,
  labelBold: TYPOGRAPHY.smallBodyTextBold,
}
// export const LegacyStyledText: (props: LegacyProps) => JSX.Element = styled(
// export const LegacyStyledText: FC<LegacyProps> = styled(
//   // styled(Component) syntax is the same
//   Text
// )<LegacyProps>`
//   ${props => {
//     let fontWeight = ''
//     if (props.fontWeight === TYPOGRAPHY.fontWeightSemiBold) {
//       fontWeight = 'SemiBold'
//     } else if (props.fontWeight === TYPOGRAPHY.fontWeightBold) {
//       fontWeight = 'Bold'
//     }
//     return styleMap[`${props.as}${fontWeight}`]
//   }}
// `

// Define the specific 'as' values and font weights used in the styleMap keys/logic
type AsValues = 'h1' | 'h2' | 'h3' | 'h4' | 'h6' | 'p' | 'label'
type FontWeightValues =
  | typeof TYPOGRAPHY.fontWeightRegular
  | typeof TYPOGRAPHY.fontWeightSemiBold
  | typeof TYPOGRAPHY.fontWeightBold

// Define LegacyProps explicitly for this component's needs.
// Include other props from the base 'Text' if they should be passable.
// Use Omit to prevent conflicts if necessary, otherwise just list needed props.
export interface LegacyProps {
  as: AsValues // REQUIRED: Determines the base style and tag lookup
  fontWeight?: FontWeightValues // OPTIONAL: Modifies the style lookup
  children?: ReactNode
  className?: string // Allow className to be passed
  // Add any other props from the original Text component that should be supported, e.g.:
  // id?: string;
  // onClick?: React.MouseEventHandler<HTMLElement>;
}

// Use React.FC for the component type signature (Fix for Error 1)
export const LegacyStyledText: FC<LegacyProps> = styled(
  Text // Base component is Emotion's styled(Text)
)<LegacyProps>`
  // Specify props for the styled wrapper
  // Dynamic styling function
  ${(props: LegacyProps) => {
    // Type props explicitly here (Fix for Error 2)
    let fontWeightSuffix = ''
    // Default to regular weight if fontWeight prop is omitted
    const currentWeight = props.fontWeight ?? TYPOGRAPHY.fontWeightRegular

    if (currentWeight === TYPOGRAPHY.fontWeightSemiBold) {
      fontWeightSuffix = 'SemiBold'
    } else if (currentWeight === TYPOGRAPHY.fontWeightBold) {
      fontWeightSuffix = 'Bold'
    }

    // Construct the key from explicitly defined props
    const styleKey = `${props.as}${fontWeightSuffix}` as keyof typeof styleMap

    // Return the SerializedStyles, add a fallback just in case
    return styleMap[styleKey] ?? css``
  }}
`
