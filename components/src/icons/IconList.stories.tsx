import * as React from 'react'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  Text,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'

import { Icon as IconComponent } from './Icon'
import { ICON_DATA_BY_NAME } from './icon-data'

import type { Meta, Story } from '@storybook/react'
import type { IconName } from './Icon'

export default {
  title: 'Library/Atoms/IconList',
  decorators: [Story => <Story />],
} as Meta

interface IconState {
  name: IconName
}

const Template: Story<React.ComponentProps<typeof IconComponent>> = args => {
  // const { backgroundColor } = args
  const [icons] = React.useState<IconState[]>(() =>
    Object.keys(ICON_DATA_BY_NAME).map(name => ({
      name,
    }))
  )

  // download icon as SVG
  const handleDownload = (iconName: IconName): void => {
    const iconData = ICON_DATA_BY_NAME[iconName]
    if (iconData == null) return

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${iconData.viewBox}" fill="currentColor">
  <path fill-rule="evenodd" d="${iconData.path}" />
</svg>`

    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${iconName}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Flex flexWrap={WRAP} gap={SPACING.spacing8}>
      {icons.map(({ name }) => (
        <Flex
          key={`icon_${name}`}
          width="8.75rem"
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          borderRadius={BORDERS.borderRadius12}
          padding={SPACING.spacing16}
          onClick={() => {
            handleDownload(name)
          }}
          border={`2px solid ${COLORS.black90}`}
          cursor="pointer"
          _hover={{
            border: `2px solid ${COLORS.blue50}`,
          }}
        >
          <IconComponent name={name} size="4rem" />
          <Text
            textAlign={TYPOGRAPHY.textAlignCenter}
            paddingTop={SPACING.spacing8}
            fontSize={TYPOGRAPHY.fontSizeP}
          >
            {name}
          </Text>
        </Flex>
      ))}
    </Flex>
  )
}
export const IconList = Template.bind({})
IconList.args = {
  backgroundColor: COLORS.blue50,
}
