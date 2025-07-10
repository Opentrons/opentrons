import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  CustomizeExpandButton,
  ListButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
} from '@opentrons/components'

import { getEnableStacking } from '../../../feature-flags/selectors'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { selectLid, selectTopLabware } from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import { CUSTOM_CATEGORY } from '../../../pages/Designer/DeckSetup/constants'

import type { ChangeEvent } from 'react'
import type { StackingProps } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { CategoryExpand } from '../../../pages/Designer/DeckSetup/DeckSetupToolbox'
import type { ThunkDispatch } from '../../../types'
import type { LabwareInfo } from './index'

interface SelectCustomLabwareProps {
  slot: string
  handleCategoryClick: (category: string, expand?: boolean) => void
  areCategoriesExpanded: CategoryExpand
  onFlexStacker: boolean
  filteredLabwareByCategory: Record<string, LabwareInfo[]>
  universalLid?: [string, LabwareDefinition2]
}
export function SelectCustomLabware(
  props: SelectCustomLabwareProps
): JSX.Element | null {
  const {
    slot,
    handleCategoryClick,
    areCategoriesExpanded,
    onFlexStacker,
    filteredLabwareByCategory,
    universalLid,
  } = props
  const enableStacking = useSelector(getEnableStacking)
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
            const lidProps: StackingProps | null =
              slot !== 'offDeck' &&
              enableStacking &&
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
                    inputCaption: '',
                    checked: selectedLidLabware != null,
                    onCheckboxChange: () => {
                      dispatch(
                        selectLid({
                          labwareDefURI:
                            selectedLidLabware === universalLid[0] ? null : uri,
                        })
                      )
                    },
                  }
                : null

            return (
              <CustomizeExpandButton
                enableStackingFF={enableStacking}
                loadName={customLabwareDefs[uri].parameters.loadName}
                allowInputField={onFlexStacker}
                key={`${index}_${uri}`}
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
