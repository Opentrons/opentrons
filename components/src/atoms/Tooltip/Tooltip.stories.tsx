import * as React from 'react'
import { Flex, Link } from '../../primitives'
import { ALIGN_CENTER, JUSTIFY_CENTER } from '../../styles'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { COLORS } from '../../helix-design-system'
import { PrimaryButton } from '../buttons'
import {
  TOOLTIP_AUTO,
  TOOLTIP_TOP_START,
  useHoverTooltip,
} from '../../tooltips'

import { Tooltip } from './index'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/Tooltip',
  decorators: [
    Story => (
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        height="8rem"
        width="100%"
        backgroundColor={COLORS.grey10}
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
      <PrimaryButton disabled={true} {...targetProps}>
        Hover me
      </PrimaryButton>
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
    const timer = setTimeout(() => {
      setShowToolTip(false)
    }, 2000)
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
