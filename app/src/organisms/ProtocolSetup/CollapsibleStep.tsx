import * as React from 'react'
import { DIRECTION_COLUMN, Flex, Text } from '@opentrons/components'

interface CollapsibleStepProps {
  expanded: boolean
  title: string
  description: string
  label: string
}

export function CollapsibleStep({expanded, title, description, label}: CollapsibleStepProps) {
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Text>{label}</Text>
      <Text>{title}</Text>
      <Text>{description}</Text>
    </Flex>
  )
}
