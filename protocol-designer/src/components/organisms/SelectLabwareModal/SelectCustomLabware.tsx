import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  CustomizeExpandButton,
  ListButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
  SPACING,
} from '@opentrons/components'
import { FLEX_STACKER_MODULE_V1, getMaxPoolCount } from '@opentrons/shared-data'

import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { selectLid, selectTopLabware } from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import { CUSTOM_CATEGORY } from '../../../pages/Designer/DeckSetup/constants'
import { getIsNestedDefinitionALid } from './utils'

import type { ChangeEvent, ReactNode } from 'react'
import type { StackingProps } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { CategoryExpand } from '../../../pages/Designer/DeckSetup/DeckSetupToolbox'
import type { ThunkDispatch } from '../../../types'
import type { LabwareInfo } from './index'

interface SelectCustomLabwareProps {
  slot: string
  handleCategoryClick: (category: string, expand?: boolean) => void
  areCategoriesExpanded: CategoryExpand
  isOnHopper: boolean
  filteredLabwareByCategory: Record<string, LabwareInfo[]>
  universalLid?: [string, LabwareDefinition2]
}
export function SelectCustomLabware(
  props: SelectCustomLabwareProps
): ReactNode {
  const {
    slot,
    handleCategoryClick,
    areCategoriesExpanded,
    isOnHopper,
    filteredLabwareByCategory,
    universalLid,
  } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedTopLabware, selectedLidLabware } = zoomedInSlotInfo

  const handleChangeLabware = (
    uri: string,
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    e.stopPropagation()
    dispatch(selectTopLabware({ labwareDefURI: uri }))
  }

  return filteredLabwareByCategory[CUSTOM_CATEGORY].length > 0 ? (
    <ListButton
      key={`ListButton_${CUSTOM_CATEGORY}`}
      type="noActive"
      padding={SPACING.spacing12}
      onClick={() => {
        handleCategoryClick(CUSTOM_CATEGORY)
      }}
    >
      <ListButtonAccordionContainer id={`${CUSTOM_CATEGORY}_${slot}`}>
        <ListButtonAccordion
          mainHeadline={t(`${CUSTOM_CATEGORY}`)}
          isExpanded={areCategoriesExpanded[CUSTOM_CATEGORY]}
        >
          {filteredLabwareByCategory[CUSTOM_CATEGORY].map(({ uri }, index) => {
            const isTiprack = customLabwareDefs[uri].parameters.isTiprack
            const hopperStackLimit = getMaxPoolCount({
              labwareDefinitions: {
                primary: customLabwareDefs[uri],
                adapter: null,
                lid: universalLid?.[1] ?? null,
              },
              model: FLEX_STACKER_MODULE_V1,
            })
            const lidProps: StackingProps | null =
              slot !== 'offDeck' &&
              universalLid != null &&
              customLabwareDefs[uri].metadata.displayCategory !== 'tubeRack'
                ? {
                    inputTitle: t('labware_quantity'),
                    errorMessage: t('unsupported_range'),
                    definition: universalLid[1],
                    checkboxCaption: t('with_lid', {
                      name: universalLid[1].metadata.displayName,
                    }),
                    inputFieldValue: 1,
                    onInputFieldChange: () => {},
                    inputCaption: isOnHopper
                      ? t('valid_range', {
                          max: hopperStackLimit,
                        })
                      : undefined,
                    checked: selectedLidLabware != null,
                    onCheckboxChange:
                      !isTiprack && isOnHopper
                        ? undefined
                        : () => {
                            dispatch(
                              selectLid({
                                labwareDefURI:
                                  selectedLidLabware === universalLid[0]
                                    ? null
                                    : `${universalLid[1].namespace}/${universalLid[1].parameters.loadName}/${universalLid[1].version}`,
                              })
                            )
                          },
                  }
                : null

            return (
              <CustomizeExpandButton
                customStackLimit={isOnHopper ? hopperStackLimit : undefined}
                isNestedDefALid={getIsNestedDefinitionALid(
                  customLabwareDefs[uri]
                )}
                allowInputField={isOnHopper}
                key={uri}
                id={`${index}_${uri}`}
                buttonText={customLabwareDefs[uri].metadata.displayName}
                buttonValue={uri}
                onChange={e => {
                  handleChangeLabware(uri, e)
                }}
                isSelected={uri === selectedTopLabware.labwareDefURI}
                stackingProps={lidProps ?? undefined}
              />
            )
          })}
        </ListButtonAccordion>
      </ListButtonAccordionContainer>
    </ListButton>
  ) : null
}
