import { StyledText } from '../../atoms/StyledText'
import { BORDERS } from '../../helix-design-system'
import { TYPOGRAPHY } from '../../ui-style-constants'
import styles from './borderradius.stories.module.css'

import type { Meta, StoryObj } from '@storybook/react'

type BorderRadiusEntry = [token: string, value: string | number]

interface StoryArgs {
  borderRadius: BorderRadiusEntry[]
}

const meta: Meta<StoryArgs> = {
  title: 'Design Tokens/BorderRadius',
}
export default meta

export const AllBorderRadiuses: StoryObj<StoryArgs> = {
  args: {
    borderRadius: Object.entries(BORDERS) as BorderRadiusEntry[],
  },
  render: args => {
    const targetBorderRadiuses = args.borderRadius
      .filter(([token]) => token.includes('borderRadius'))
      .sort((a, b) => {
        const aValue = Number.parseFloat(String(a[1]))
        const bValue = Number.parseFloat(String(b[1]))
        return aValue - bValue
      })

    return (
      <div className={styles.container}>
        {targetBorderRadiuses.map((br, index) => (
          <div className={styles.item} key={`spacing_${index}`}>
            <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightRegular}>
              {`${br[0]}" ${br[1]}`}
            </StyledText>
            <div
              className={styles.example_box}
              style={{
                borderRadius: typeof br[1] === 'number' ? `${br[1]}px` : br[1],
              }}
            />
          </div>
        ))}
      </div>
    )
  },
}
