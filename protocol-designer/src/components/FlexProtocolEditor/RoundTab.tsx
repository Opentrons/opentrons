import React from 'react'
import { RoundTab } from '@opentrons/components'
import { navPillsNameTabList } from './constant'
import { StyledText } from './StyledText'

interface RoundTabsProps {
  setCurrentTab: (tabIndex: number) => void
  currentTab: number
}

export const RoundTabs: React.FC<RoundTabsProps> = ({
  setCurrentTab,
  currentTab,
}): JSX.Element => {
  return (
    <>
      {navPillsNameTabList.map(({ name, navPillPage }, index) => {
        return (
          <RoundTab
            key={index}
            isCurrent={navPillPage.includes(currentTab)}
            // onClick={() => setCurrentTab(index)}
          >
            <StyledText as="h4">{name}</StyledText>
          </RoundTab>
        )
      })}
    </>
  )
}
