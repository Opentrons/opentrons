import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  ListItemDescriptor,
  SPACING,
  StyledText,
} from '@opentrons/components'

interface SlotInformationProps {
  location: string
  liquids?: string[]
  labwares?: string[]
  modules?: string[]
}

export const SlotInformation: React.FC<SlotInformationProps> = ({
  location,
  liquids = [],
  labwares = [],
  modules = [],
}) => {
  const { t } = useTranslation('shared')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      width="100%"
    >
      <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
        <DeckInfoLabel deckLabel={location} />
        <StyledText desktopStyle="headingSmallBold">
          {t('slot_stack_information')}
        </StyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StackInfoList title={t('liquid')} items={liquids} />
        <StackInfoList title={t('labware')} items={labwares} />
        <StackInfoList title={t('module')} items={modules} />
      </Flex>
    </Flex>
  )
}

interface StackInfoListProps {
  title: string
  items: string[]
}

function StackInfoList({ title, items }: StackInfoListProps): JSX.Element {
  return (
    <>
      {items.length > 0 ? (
        items.map((item, index) => (
          <StackInfo
            key={`${title}_${index}`}
            title={title}
            stackInformation={item}
          />
        ))
      ) : (
        <StackInfo title={title} />
      )}
    </>
  )
}

interface StackInfoProps {
  title: string
  stackInformation?: string
}

function StackInfo({ title, stackInformation }: StackInfoProps): JSX.Element {
  const { t } = useTranslation('shared')
  return (
    <ListItem type="noActive">
      <ListItemDescriptor
        type="mini"
        content={stackInformation ?? t('none')}
        description={title}
      />
    </ListItem>
  )
}
