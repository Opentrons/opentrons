import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  CustomizeExpandButton,
  ListButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_V1,
  getMaxPoolCount,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getOnlyLatestDefs } from '../../../labware-defs'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import {
  selectAdapter,
  selectLid,
  selectTopLabware,
  selectTopLabwareAmount,
} from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import { ORDERED_CATEGORIES } from '../../../pages/Designer/DeckSetup/constants'
import { getStackerDefinitions } from '../../../pages/Designer/DeckSetup/utils'
import { TIPRACK_LID_LOADNAME } from '../../../pages/Designer/utils'
import { SelectLabwareOnAdapter } from './SelectLabwareOnAdapter'
import { SelectLidOnLabware } from './SelectLidOnLabware'
import { getIsNestedDefinitionALid } from './utils'

import type { ChangeEvent, ReactNode } from 'react'
import type { StackingProps } from '@opentrons/components'
import type { LabwareDefinition2, ModuleType } from '@opentrons/shared-data'
import type { CategoryExpand } from '../../../pages/Designer/DeckSetup/DeckSetupToolbox'
import type { ThunkDispatch } from '../../../types'
import type { LabwareInfo } from './index'

interface SelectLabwareProps {
  slot: string
  handleCategoryClick: (category: string, expand?: boolean) => void
  areCategoriesExpanded: CategoryExpand
  isOnHopper: boolean
  filteredLabwareByCategory: Record<string, LabwareInfo[]>
  searchFilter: (termToCheck: string) => boolean
  getIsLabwareFiltered: (labwareDef: LabwareDefinition2) => boolean
  universalLid?: [string, LabwareDefinition2]
  moduleType: ModuleType | null
}
export function SelectLabware(props: SelectLabwareProps): ReactNode {
  const {
    slot,
    handleCategoryClick,
    areCategoriesExpanded,
    isOnHopper,
    filteredLabwareByCategory,
    universalLid,
    getIsLabwareFiltered,
    searchFilter,
    moduleType,
  } = props
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getOnlyLatestDefs()
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedTopLabware, selectedAdapterDefURI, selectedLidLabware } =
    zoomedInSlotInfo
  const lidLoadNames = Object.values(defs)
    .filter(
      def =>
        def.allowedRoles?.includes('lid') &&
        def.parameters.loadName !== TIPRACK_LID_LOADNAME
    )
    ?.map(def => def.parameters.loadName)

  const handleSelectLabware = (
    isAdapter: boolean,
    uri: string,
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    e.stopPropagation()
    if (isAdapter) {
      dispatch(
        selectAdapter({
          adapterDefURI: uri === selectedAdapterDefURI ? null : uri,
        })
      )
      dispatch(
        selectTopLabware({
          labwareDefURI: null,
        })
      )
      dispatch(
        selectLid({
          labwareDefURI: null,
        })
      )
    } else {
      dispatch(
        selectTopLabware({
          labwareDefURI: uri === selectedTopLabware.labwareDefURI ? null : uri,
        })
      )
      dispatch(
        selectLid({
          labwareDefURI: null,
        })
      )
      // Clear adapter selection when selecting standalone labware
      dispatch(
        selectAdapter({
          adapterDefURI: null,
        })
      )
    }
  }

  return (
    <>
      {ORDERED_CATEGORIES.map(category => {
        const isLidValid = category === 'tipRack' || !isOnHopper
        if (filteredLabwareByCategory[category].length > 0) {
          return (
            <ListButton
              key={`ListButton_${category}`}
              type="noActive"
              padding={SPACING.spacing12}
              onClick={() => {
                handleCategoryClick(category)
              }}
            >
              <ListButtonAccordionContainer id={`${category}_${slot}`}>
                <ListButtonAccordion
                  mainHeadline={t(`${category}`)}
                  isExpanded={areCategoriesExpanded[category]}
                >
                  {filteredLabwareByCategory[category]?.map(({ def, uri }) => {
                    const { parameters } = def
                    const { loadName, isTiprack } = parameters

                    const isAdapter = def.allowedRoles?.includes('adapter')
                    const isVacuumModule = moduleType === VACUUM_MODULE_TYPE
                    // Don't offer lids for vacuum module labware
                    const stackingLabwareDefUris = getStackerDefinitions(
                      {
                        ...defs,
                        ...customLabwareDefs,
                      },
                      universalLid?.[0],
                      loadName,
                      category
                    )
                    const hopperStackLimit = getMaxPoolCount({
                      labwareDefinitions: {
                        primary: def,
                        adapter: null,
                        lid: universalLid?.[1] ?? null,
                      },
                      model: FLEX_STACKER_MODULE_V1,
                    })

                    const stackingProps: StackingProps | null =
                      isOnHopper ||
                      (stackingLabwareDefUris.length === 1 &&
                        !isVacuumModule &&
                        slot !== 'offDeck')
                        ? {
                            inputTitle: t('labware_quantity'),
                            errorMessage: t('unsupported_range'),
                            inputCaption: t('valid_range', {
                              max: isOnHopper
                                ? hopperStackLimit
                                : defs[stackingLabwareDefUris[0]].stackLimit,
                            }),
                            definition: defs[stackingLabwareDefUris[0]],
                            inputFieldValue: selectedTopLabware.amount ?? 0,
                            onInputFieldChange: (e: ChangeEvent<any>) => {
                              dispatch(
                                selectTopLabwareAmount({
                                  amount: parseInt(e.target.value as string),
                                })
                              )
                            },
                            checkboxCaption: t('with_lid', {
                              name: defs[stackingLabwareDefUris[0]].metadata
                                .displayName,
                            }),
                            checked: selectedLidLabware != null,
                            onCheckboxChange:
                              (!isTiprack && isOnHopper) || !isLidValid
                                ? undefined
                                : () => {
                                    dispatch(
                                      selectLid({
                                        labwareDefURI:
                                          selectedLidLabware ===
                                          stackingLabwareDefUris[0]
                                            ? null
                                            : stackingLabwareDefUris[0],
                                      })
                                    )
                                  },
                          }
                        : null
                    return searchFilter(def.metadata.displayName) &&
                      !getIsLabwareFiltered(def) ? (
                      <Fragment key={`${category}_${loadName}`}>
                        <CustomizeExpandButton
                          customStackLimit={
                            isOnHopper ? hopperStackLimit : undefined
                          }
                          isNestedDefALid={getIsNestedDefinitionALid(def)}
                          allowInputField={
                            isOnHopper || lidLoadNames.includes(loadName)
                          }
                          stackingProps={stackingProps ?? undefined}
                          id={`${category}_${loadName}`}
                          buttonText={def.metadata.displayName}
                          buttonValue={uri}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            handleSelectLabware(isAdapter ?? false, uri, e)
                          }}
                          isSelected={
                            (isAdapter && uri === selectedAdapterDefURI) ||
                            (!isAdapter &&
                              uri === selectedTopLabware.labwareDefURI &&
                              selectedAdapterDefURI == null)
                          }
                        />
                        <SelectLabwareOnAdapter
                          slot={slot}
                          lidLoadNames={lidLoadNames}
                          parentLabwareURI={uri}
                          isAdapter={isAdapter ?? false}
                          category={category}
                          loadName={loadName}
                          universalLid={universalLid}
                        />
                        <SelectLidOnLabware
                          lidLoadNames={lidLoadNames}
                          parentLabwareURI={uri}
                          isAdapter={isAdapter ?? false}
                          category={category}
                          loadName={loadName}
                          lidURIs={
                            isOnHopper || isVacuumModule
                              ? []
                              : stackingLabwareDefUris
                          }
                        />
                      </Fragment>
                    ) : null
                  })}
                </ListButtonAccordion>
              </ListButtonAccordionContainer>
            </ListButton>
          )
        }
      })}
    </>
  )
}
