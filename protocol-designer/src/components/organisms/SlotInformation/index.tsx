import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { clsx } from 'clsx'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  ListItemDescriptor,
  RobotInfoLabel,
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
  VACUUM_MODULE_A3_ADDRESSABLE_AREA,
} from '@opentrons/shared-data'
import {
  getIsSlotAHopper,
  getIsSlotAVacuumDock,
} from '@opentrons/step-generation'

import {
  VACUUM_DOCK_DISPLAY_LOCATION,
  VACUUM_MODULE_SLOT,
} from '/protocol-designer/constants'
import { useDeckSetupWindowBreakPoint } from '/protocol-designer/pages/Designer/DeckSetup/utils'
import { getColumnFromWellName } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/PipetteFields/TipSelectionWizard/utils'
import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'

import type { FC, ReactNode } from 'react'
import type { RobotType } from '@opentrons/shared-data'

interface SlotInformationProps {
  location: string
  robotType: RobotType
  liquids?: string[]
  labwares?: string[]
  modules?: string[]
  fixtures?: string[]
}

const EMPTY_ITEMS: string[] = []

export const SlotInformation: FC<SlotInformationProps> = ({
  location,
  robotType,
  liquids = EMPTY_ITEMS,
  labwares = EMPTY_ITEMS,
  modules = EMPTY_ITEMS,
  fixtures = EMPTY_ITEMS,
}) => {
  const { t } = useTranslation('shared')
  const isOffDeck = location === 'offDeck'
  const tcDisplayLocation =
    robotType === FLEX_ROBOT_TYPE
      ? TC_MODULE_LOCATION_OT3
      : TC_MODULE_LOCATION_OT2

  let modifiedLocation = location
  if (
    modules.includes(getModuleDisplayName(THERMOCYCLER_MODULE_V2)) ||
    modules.includes(getModuleDisplayName(THERMOCYCLER_MODULE_V1))
  ) {
    modifiedLocation = tcDisplayLocation
  } else if (getIsSlotAHopper(location)) {
    modifiedLocation = t('stacker', {
      slot: getColumnFromWellName(location),
    })
  } else if (getIsSlotAVacuumDock(location)) {
    modifiedLocation = VACUUM_DOCK_DISPLAY_LOCATION
  } else if (location === VACUUM_MODULE_A3_ADDRESSABLE_AREA) {
    modifiedLocation = VACUUM_MODULE_SLOT
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      maxWidth="100%"
      width="100%"
    >
      <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
        {isOffDeck ? null : <RobotInfoLabel deckLabel={modifiedLocation} />}
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
                  className={clsx(
                    lineClampStyles.line_clamp,
                    lineClampStyles.word_normal
                  )}
                  style={{ WebkitLineClamp: 2 }}
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

function StackInfoList({ title, items }: StackInfoListProps): ReactNode {
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
        reducedItems.map(item => (
          <StackInfo
            key={`${title}_${item.item}`}
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

function StackInfo({ title, stackInformation }: StackInfoProps): ReactNode {
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
            className={clsx(
              lineClampStyles.line_clamp,
              lineClampStyles.word_normal
            )}
            style={{ WebkitLineClamp: 3 }}
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
