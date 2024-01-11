import * as React from 'react'
import {
  Flex,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  LEGACY_COLORS,
  useHoverTooltip,
  TOOLTIP_TOP_START,
  TOOLTIP_AUTO,
  SIZE_4,
  Link,
  TYPOGRAPHY,
} from '@opentrons/components'
import { TertiaryButton } from '../buttons'
import { Tooltip } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Tooltip',
  decorators: [
    Story => (
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        height={SIZE_4}
        width="100%"
        backgroundColor={LEGACY_COLORS.fundamentalsBackground}
      >
        <Story />
      </Flex>
    ),
  ],
} as Meta

// WithHover: Disabled button with tooltip app's general use case
const WithHoverTemplate: Story<React.ComponentProps<typeof Tooltip>> = args => {
  const { key, children, placement } = args
  const [targetProps, tooltipProps] = useHoverTooltip({ placement })
  return (
    <>
      <TertiaryButton disabled={true} {...targetProps}>
        Hover me
      </TertiaryButton>
      <Tooltip key={key} tooltipProps={tooltipProps}>
        {children}
      </Tooltip>
    </>
  )
}

export const WithHoverTooltip = WithHoverTemplate.bind({})
WithHoverTooltip.args = {
  key: 'tooltipKey',
  children: 'tooltip text',
  placement: TOOLTIP_AUTO,
}

const WithClickTemplate: Story<React.ComponentProps<typeof Tooltip>> = args => {
  const { key, children, width, placement } = args
  const [showToolTip, setShowToolTip] = React.useState<boolean>(false)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement,
  })

  const handleCopy = async (): Promise<void> => {
    setShowToolTip(true)
  }

  React.useEffect(() => {
    const timer = setTimeout(() => setShowToolTip(false), 2000)
    return () => {
      clearTimeout(timer)
    }
  }, [showToolTip])

  return (
    <Link
      fontSize={TYPOGRAPHY.fontSizeP}
      onClick={handleCopy}
      role="button"
      {...targetProps}
    >
      Click me
      {showToolTip && (
        <Tooltip key={key} width={width} tooltipProps={tooltipProps}>
          {children}
        </Tooltip>
      )}
    </Link>
  )
}

export const WithClickTooltip = WithClickTemplate.bind({})
WithClickTooltip.args = {
  key: 'tooltipKey',
  children: 'tooltip text',
  width: '5rem',
  placement: TOOLTIP_TOP_START,
}
