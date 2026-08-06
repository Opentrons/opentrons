import { StyledText } from '../../atoms/StyledText'
import { SPACING } from '../../ui-style-constants'
import styles from './spacing.stories.module.css'

import type { Meta, StoryObj } from '@storybook/react'

type SpacingEntry = readonly [key: string, value: string]

interface StoryArgs {
  spacings: SpacingEntry[]
}

// Type guard to ensure spacing entry has string value
const isValidSpacingEntry = (
  entry: readonly [string, unknown]
): entry is SpacingEntry => {
  return typeof entry[1] === 'string' && !entry[1].includes('auto')
}

const convertToPx = (remFormat: string): string => {
  const pxVal = Number(remFormat.replace('rem', '')) * 16
  return `${pxVal}px`
}

const meta: Meta<StoryArgs> = {
  title: 'Design Tokens/Spacing',
}
export default meta

export const AllSpacing: StoryObj<StoryArgs> = {
  args: {
    spacings: Object.entries(SPACING) as SpacingEntry[],
  },
  render: (args: StoryArgs) => {
    const targetSpacings = args.spacings.filter(isValidSpacingEntry)
    // sort by rem value
    const sortedSpacing = targetSpacings.sort((a, b): number => {
      const aValue = parseFloat(a[1].replace('rem', ''))
      const bValue = parseFloat(b[1].replace('rem', ''))
      return aValue - bValue
    })

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
  },
}
