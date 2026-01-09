// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'

import { StyledText } from '../../atoms/StyledText'
import { COLORS } from '../../helix-design-system'
import { SPACING } from '../../ui-style-constants'
import styles from './spacing.stories.module.css'

import type { Meta, Story } from '@storybook/react'

export default {
  title: 'Design Tokens/Spacing',
} as Meta

interface SpacingsStorybookProps {
  spacings: string[]
}

const Template: Story<SpacingsStorybookProps> = args => {
  const targetSpacings = args.spacings.filter(s => !s[1].includes('auto'))
  // sort by rem value
  const sortedSpacing = targetSpacings.sort((a, b) => {
    const aValue = parseFloat(a[1].replace('rem', ''))
    const bValue = parseFloat(b[1].replace('rem', ''))
    return aValue - bValue
  })

  const convertToPx = (remFormat: string): string => {
    const pxVal = Number(remFormat.replace('rem', '')) * 16
    return `${pxVal}px`
  }

  return (
    <div className={styles.container}>
      {sortedSpacing.map((spacing, index) => (
        <div key={`spacing_${index}`} className={styles.item}>
          <StyledText desktopStyle="bodyLargeSemiBold">
            {`${spacing[0]} - ${spacing[1]}: ${convertToPx(spacing[1])}`}
          </StyledText>
          <div
            className={styles.spacing_example}
            style={{
              gap: spacing[1],
            }}
          >
            <div className={styles.styled_box} />
            <div className={styles.styled_box} />
          </div>
        </div>
      ))}
    </div>
  )
}

export const AllSpacing = Template.bind({})
const allSpacings = Object.entries(SPACING)
AllSpacing.args = {
  spacings: allSpacings,
}
