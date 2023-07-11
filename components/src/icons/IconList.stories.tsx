import * as React from 'react'

import {
  Text,
  Flex,
  DIRECTION_COLUMN,
  WRAP,
  TYPOGRAPHY,
  ALIGN_CENTER,
  COLORS,
  SPACING,
  BORDERS,
} from '@opentrons/components'
import { ICON_DATA_BY_NAME } from './icon-data'
import { Icon as IconComponent, IconName } from './Icon'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/IconList',
  decorators: [Story => <Story />],
} as Meta

interface IconState {
  name: IconName
  showText: boolean
}

const Template: Story<React.ComponentProps<typeof IconComponent>> = args => {
  // const { backgroundColor } = args
  const [icons, setIcons] = React.useState<IconState[]>(() =>
    Object.keys(ICON_DATA_BY_NAME).map(name => ({
      name: name as IconName,
      showText: false,
    }))
  )
  const [selectedIcon, setSelectedIcon] = React.useState<IconName | null>(null)

  // copy icon name
  const handleCopy = async (
    iconName: IconName,
    index: number
  ): Promise<void> => {
    await navigator.clipboard.writeText(iconName)
    setIcons(prevIcons =>
      prevIcons.map((icon, i) => {
        if (i === index) {
          return { ...icon, showText: true }
        } else {
          return icon
        }
      })
    )
    setSelectedIcon(iconName)
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIcons(prevIcons =>
        prevIcons.map(icon => ({ ...icon, showText: false }))
      )
      setSelectedIcon(null)
    }, 2000)
    return () => {
      clearTimeout(timer)
    }
  }, [icons])

  return (
    <Flex flexWrap={WRAP}>
      {icons.map(({ name, showText }, index) => (
        <Flex
          key={`icon_${name}`}
          width="8.75rem"
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          borderRadius={BORDERS.borderRadiusSize3}
          marginRight={SPACING.spacing8}
          marginBottom={SPACING.spacing8}
          padding={SPACING.spacing16}
          onClick={() => handleCopy(name, index)}
          border={
            selectedIcon === name
              ? `2px solid ${COLORS.blueEnabled}`
              : `2px solid ${COLORS.darkBlackEnabled}`
          }
        >
          <IconComponent name={name as IconName} size="4rem" />
          <Text
            textAlign={TYPOGRAPHY.textAlignCenter}
            marginTop={SPACING.spacing8}
            fontSize={TYPOGRAPHY.fontSizeP}
          >
            {name}
          </Text>
          <Flex height="1.5rem">
            {showText ? (
              <Text color={COLORS.blueEnabled}> {'copied'}</Text>
            ) : null}
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}
export const IconList = Template.bind({})
IconList.args = {
  backgroundColor: COLORS.blueEnabled,
}
