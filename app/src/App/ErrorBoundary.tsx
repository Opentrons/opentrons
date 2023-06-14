import * as React from 'react'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../atoms/text'
import { MediumButton } from '../atoms/buttons'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInformation?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInformation: React.ErrorInfo): void {
    console.log(error) // ToDo send the error to robot logs
    this.setState({ errorInformation })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Flex
          width="100%"
          height="max-content"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing16}
          padding={SPACING.spacing40}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
        >
          <StyledText as="h1" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {'Something went wrong'}
          </StyledText>
          <MediumButton
            flex="1"
            buttonText="Reload the app"
            onClick={() => console.log('reload the app')}
          />
        </Flex>
      )
    } else {
      return this.props.children
    }
  }
}
