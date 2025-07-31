import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  NO_WRAP,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  getAllLiquidClassDefs,
  TRASH_BIN_ADAPTER_FIXTURE,
} from '@opentrons/shared-data'

import { useToaster } from '/app/organisms/ToasterOven'

import { CONSOLIDATE, DISTRIBUTE } from './constants'

import type { QuickTransferSummaryState } from './types'

interface OverviewProps {
  state: QuickTransferSummaryState
}

export function Overview(props: OverviewProps): JSX.Element | null {
  const { state } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const { makeSnackbar } = useToaster()
  const allLiquidClasses = getAllLiquidClassDefs()
  let transferCopy = t('volume_per_well')
  if (state.transferType === CONSOLIDATE) {
    transferCopy = t('aspirate_volume')
  } else if (state.transferType === DISTRIBUTE) {
    transferCopy = t('dispense_volume')
  }
  const onClick = (): void => {
    makeSnackbar(t('create_new_to_edit') as string)
  }

  const displayItems = [
    {
      option: t('pipette'),
      value: state.pipette.displayName,
    },
    {
      option: t('tip_rack'),
      value: state.tipRack.metadata.displayName,
    },
    {
      option: t('source_labware'),
      value: state.source.metadata.displayName,
    },
    {
      option: t('destination_labware'),
      value:
        state.destination === 'source'
          ? state.source.metadata.displayName
          : state.destination.metadata.displayName,
    },
    {
      option: transferCopy,
      value: `${state.volume}µL`,
    },
    {
      option: t('pipette_path'),
      value: t(state.path),
    },
    {
      option: t('tip_change_frequency'),
      value: t(state.changeTip),
    },
    {
      option: t('tip_drop_location'),
      value: t(
        `${
          state.dropTipLocation?.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
            ? 'trashBin'
            : 'wasteChute'
        }_location`,
        {
          slotName:
            FLEX_SINGLE_SLOT_BY_CUTOUT_ID[state.dropTipLocation?.cutoutId],
        }
      ),
    },
    {
      option: t('liquid_class'),
      value: allLiquidClasses[state?.liquidClassName]?.displayName,
    },
  ]

  return (
    <Flex
      gridGap={SPACING.spacing8}
      flexDirection={DIRECTION_COLUMN}
      paddingTop="12rem"
    >
      {displayItems.map(displayItem => (
        <ListItem type="default" key={displayItem.option} onClick={onClick}>
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
            <StyledText
              oddStyle="level4HeaderRegular"
              width="20rem"
              whiteSpace={NO_WRAP}
            >
              {displayItem.option}
            </StyledText>
            <StyledText
              oddStyle="level4HeaderRegular"
              color={COLORS.grey60}
              textAlign={TYPOGRAPHY.textAlignRight}
            >
              {displayItem.value}
            </StyledText>
          </Flex>
        </ListItem>
      ))}
    </Flex>
  )
}
