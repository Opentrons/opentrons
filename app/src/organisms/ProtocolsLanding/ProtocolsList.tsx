import * as React from 'react'
import {
  Box,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/Buttons'
import { Slideout } from '../../atoms/Slideout'
import { UploadInput } from './UploadInput'
import { ProtocolCard } from './ProtocolCard'
import { EmptyStateLinks } from './EmptyStateLinks'
export function ProtocolsList(): JSX.Element | null {
  const [showSlideout, setShowSlideout] = React.useState(false)
  return (
    <Box padding={SPACING.spacing4}>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginBottom={SPACING.spacing5}
      >
        <StyledText as="h1">Protocols</StyledText>
        <SecondaryButton
          onClick={() => {
            setShowSlideout(true)
          }}
        >
          Import
        </SecondaryButton>
      </Flex>
      <StyledText as="p" paddingBottom={SPACING.spacing4}>
        All Protocols
      </StyledText>
      <Flex flexDirection="column">
        <ProtocolCard />
      </Flex>
      <EmptyStateLinks title="Create or download a new protocol" />
      <Slideout
        title="Import a Protocol"
        isExpanded={showSlideout}
        onCloseClick={() => setShowSlideout(false)}
      >
        <UploadInput
          onUpload={() => {
            console.log('todo')
          }}
        />
      </Slideout>
    </Box>
  )
}
