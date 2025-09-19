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
  showCopied: boolean
}

const Template: Story<React.ComponentProps<typeof IconComponent>> = args => {
  // const { backgroundColor } = args
  const [icons, setIcons] = React.useState<IconState[]>(() =>
    Object.keys(ICON_DATA_BY_NAME).map(name => ({
      name,
      showCopied: false,
    }))
  )

  // copy icon name to clipboard
  const handleCopy = async (iconName: IconName): Promise<void> => {
    await navigator.clipboard.writeText(iconName)
    setIcons(prevIcons =>
      prevIcons.map(icon => {
        if (icon.name === iconName) {
          return { ...icon, showCopied: true }
        }
        return { ...icon, showCopied: false }
      })
    )
  }

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

  // reset copied state after 2 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIcons(prevIcons =>
        prevIcons.map(icon => ({ ...icon, showCopied: false }))
      )
    }, 2000)
    return () => {
      clearTimeout(timer)
    }
  }, [icons])

  return (
    <Flex flexWrap={WRAP} gap={SPACING.spacing8}>
      {icons.map(({ name, showCopied }) => (
        <Flex
          key={`icon_${name}`}
          width="8.75rem"
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          borderRadius={BORDERS.borderRadius12}
          padding={SPACING.spacing16}
          border={`2px solid ${COLORS.black90}`}
        >
          <IconComponent name={name} size="4rem" />
          <Text
            textAlign={TYPOGRAPHY.textAlignCenter}
            paddingTop={SPACING.spacing8}
            fontSize={TYPOGRAPHY.fontSizeP}
          >
            {name}
          </Text>
          <Flex
            paddingTop={SPACING.spacing8}
            gap={SPACING.spacing4}
            alignItems={ALIGN_CENTER}
          >
            <Text
              fontSize={TYPOGRAPHY.fontSizeCaption}
              color={COLORS.blue50}
              cursor="pointer"
              onClick={() => {
                void handleCopy(name)
              }}
              _hover={{
                textDecoration: 'underline',
              }}
            >
              copy
            </Text>
            <Text fontSize={TYPOGRAPHY.fontSizeCaption} color={COLORS.grey50}>
              |
            </Text>
            <Text
              fontSize={TYPOGRAPHY.fontSizeCaption}
              color={COLORS.blue50}
              cursor="pointer"
              onClick={() => {
                handleDownload(name)
              }}
              _hover={{
                textDecoration: 'underline',
              }}
            >
              download
            </Text>
          </Flex>
          <Flex height="1rem" alignItems={ALIGN_CENTER}>
            {showCopied ? (
              <Text
                fontSize={TYPOGRAPHY.fontSizeCaption}
                color={COLORS.green50}
              >
                copied!
              </Text>
            ) : null}
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}
export const IconList = Template.bind({})
IconList.args = {
  backgroundColor: COLORS.blue50,
}
