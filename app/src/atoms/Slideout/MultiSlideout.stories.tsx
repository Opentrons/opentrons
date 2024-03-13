import * as React from 'react'
import { TYPOGRAPHY, PrimaryBtn, COLORS } from '@opentrons/components'
import { MultiSlideout } from './MultiSlideout'
import { StyledText } from '../text'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/MultiSlideout',
  component: MultiSlideout,
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const Template: Story<React.ComponentProps<typeof MultiSlideout>> = args => {
  const [firstPage, setFirstPage] = React.useState<boolean>(false)

  const togglePage = () => {
    setFirstPage(prevState => !prevState)
  }

  const Children = (
    <React.Fragment>
      <StyledText
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        fontSize={TYPOGRAPHY.fontSizeP}
      >
        {firstPage ? 'first page body' : 'second page body'}
      </StyledText>

      <PrimaryBtn
        marginTop="28rem"
        onClick={togglePage}
        backgroundColor={COLORS.blue50}
        textTransform={TYPOGRAPHY.textTransformNone}
      >
        <StyledText
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          fontSize={TYPOGRAPHY.fontSizeP}
        >
          {firstPage ? 'Go to Second Page' : 'Go to First Page'}
        </StyledText>
      </PrimaryBtn>
    </React.Fragment>
  )

  return (
    <MultiSlideout
      {...args}
      children={Children}
      currentStep={firstPage ? 1 : 2}
    />
  )
}

export const Primary = Template.bind({})
Primary.args = {
  title: 'This is the slideout title with the max width',
  isExpanded: 'true',
  maxSteps: 2,
}
