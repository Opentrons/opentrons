import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import {
  ALIGN_CENTER,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  ListItemDescriptor,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getModuleDisplayName,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import { useDeckSetupWindowBreakPoint } from '../../../pages/Designer/DeckSetup/utils'
import { LINE_CLAMP_TEXT_STYLE } from '../../atoms'

import type { FC } from 'react'
import type { RobotType } from '@opentrons/shared-data'

interface SlotInformationProps {
  location: string
  robotType: RobotType
  liquids?: string[]
  labwares?: string[]
  modules?: string[]
  fixtures?: string[]
}

export const SlotInformation: FC<SlotInformationProps> = ({
  location,
  robotType,
  liquids = [],
  labwares = [],
  modules = [],
  fixtures = [],
}) => {
  const { t } = useTranslation('shared')
  const isOffDeck = location === 'offDeck'
  const tcDisplayLocation =
    robotType === FLEX_ROBOT_TYPE
      ? TC_MODULE_LOCATION_OT3
      : TC_MODULE_LOCATION_OT2
  const modifiedLocation =
    modules.includes(getModuleDisplayName(THERMOCYCLER_MODULE_V2)) ||
    modules.includes(getModuleDisplayName(THERMOCYCLER_MODULE_V1))
      ? tcDisplayLocation
      : location

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      maxWidth="100%"
      width="100%"
    >
      <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
        {isOffDeck ? null : <DeckInfoLabel deckLabel={modifiedLocation} />}
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t(isOffDeck ? 'labware_detail' : 'slot_detail')}
        </StyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        {liquids.length > 1 ? (
          <ListItem type="default" width="max-content">
            <ListItemDescriptor
              changeFlexDirection={false}
              type="default"
              content={
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  textAlign={TYPOGRAPHY.textAlignRight}
                  css={LINE_CLAMP_TEXT_STYLE(2, true)}
                >
                  {liquids.join(', ')}
                </StyledText>
              }
              description={<Flex width="7.40625rem">{t('liquid')}</Flex>}
            />
          </ListItem>
        ) : (
          <StackInfoList title={t('liquid')} items={liquids} />
        )}
        <StackInfoList title={t('labware')} items={labwares} />

        {isOffDeck ? null : (
          <StackInfoList title={t('module')} items={modules} />
        )}
        {robotType === FLEX_ROBOT_TYPE && !isOffDeck ? (
          <StackInfoList title={t('fixtures')} items={fixtures} />
        ) : null}
      </Flex>
    </Flex>
  )
}

interface StackInfoListProps {
  title: string
  items: string[]
}

function StackInfoList({ title, items }: StackInfoListProps): JSX.Element {
  const countMap = items.reduce((acc: Record<string, number>, item) => {
    acc[item] = (acc[item] || 0) + 1
    return acc
  }, {})

  //  remove duplicates from the items array and include the acount
  const reducedItems = Object.entries(countMap).map(([item, count]) => ({
    item,
    count,
  }))

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gridGap={SPACING.spacing4}
    >
      {reducedItems.length > 0 ? (
        reducedItems.map((item, index) => (
          <StackInfo
            key={`${title}_${index}`}
            title={title}
            stackInformation={
              item.count > 1
                ? `${item.item} (amount: ${item.count})`
                : item.item
            }
          />
        ))
      ) : (
        <StackInfo title={title} />
      )}
    </Flex>
  )
}

interface StackInfoProps {
  title: string
  stackInformation?: string
}

function StackInfo({ title, stackInformation }: StackInfoProps): JSX.Element {
  const { t } = useTranslation('shared')
  const breakPointSize = useDeckSetupWindowBreakPoint()
  const pathLocation = useLocation()

  return (
    <ListItem type="default">
      <ListItemDescriptor
        changeFlexDirection={
          breakPointSize === 'medium' && pathLocation.pathname === '/designer'
        }
        type="default"
        content={
          <StyledText
            desktopStyle="bodyDefaultRegular"
            textAlign={
              breakPointSize === 'medium'
                ? TYPOGRAPHY.textAlignLeft
                : TYPOGRAPHY.textAlignRight
            }
            css={LINE_CLAMP_TEXT_STYLE(3, true)}
          >
            {stackInformation ?? t('none')}
          </StyledText>
        }
        description={
          <Flex>
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              {title}
            </StyledText>
          </Flex>
        }
      />
    </ListItem>
  )
}
