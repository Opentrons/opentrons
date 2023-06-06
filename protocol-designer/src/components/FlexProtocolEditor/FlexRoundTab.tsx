import React from 'react'
import { RoundTab } from '@opentrons/components'
import { navPillsNameTabList } from './constant'
import { StyledText } from './StyledText'

interface RoundTabsProps {
  setCurrentTab: (tabIndex: number) => void
  currentTab: number
  isEdit: boolean
}

export const FlexRoundTab: React.FC<RoundTabsProps> = ({
  setCurrentTab,
  currentTab,
  isEdit,
}): JSX.Element => {
  return (
    <>
      {navPillsNameTabList.map(({ name, navPillPage }, index) => {
        return (
          <RoundTab
            key={index}
            isCurrent={navPillPage.includes(currentTab)}
            onClick={() => {
              if (!isEdit) setCurrentTab(navPillPage[0])
            }}
            disabled={isEdit && !currentTab}
          >
            <StyledText as="h4">{name}</StyledText>
          </RoundTab>
        )
      })}
    </>
  )
}
