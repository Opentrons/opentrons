import * as React from 'react'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Skeleton } from '../../atoms/Skeleton'

interface Props {
  iconColor: string
  header: string
  isSuccess: boolean
  children?: React.ReactNode
  subHeader?: string
  isPending?: boolean
}
const BACKGROUND_SIZE = '47rem'

export function SimpleWizardBody(props: Props): JSX.Element {
  const { iconColor, children, header, subHeader, isSuccess, isPending } = props

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        height="100%"
        marginBottom="5.6875rem"
        marginTop="6.8125rem"
      >
        {isPending ? (
          <Flex
            gridGap={SPACING.spacing5}
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
          >
            <Skeleton
              width="6.25rem"
              height="6.25rem"
              backgroundSize={BACKGROUND_SIZE}
            />
            <Skeleton
              width="18rem"
              height="1.125rem"
              backgroundSize={BACKGROUND_SIZE}
            />
          </Flex>
        ) : (
          <>
            <Icon
              name={isSuccess ? 'ot-check' : 'ot-alert'}
              size="2.5rem"
              color={iconColor}
              aria-label={isSuccess ? 'ot-check' : 'ot-alert'}
            />
            <StyledText
              as="h1"
              marginTop={SPACING.spacing5}
              marginBottom={SPACING.spacing3}
            >
              {header}
            </StyledText>
            {subHeader != null ? (
              <StyledText
                as="p"
                marginX="6.25rem"
                textAlign={ALIGN_CENTER}
                height="1.75rem"
              >
                {subHeader}
              </StyledText>
            ) : (
              <Flex height="1.75rem" />
            )}
          </>
        )}
      </Flex>
      <Flex
        paddingX={SPACING.spacing6}
        paddingBottom={SPACING.spacing6}
        justifyContent={JUSTIFY_FLEX_END}
      >
        {children}
      </Flex>
    </Flex>
  )
}
