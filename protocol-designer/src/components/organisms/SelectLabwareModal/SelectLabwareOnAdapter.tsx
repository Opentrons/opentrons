import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  CustomizeExpandButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
} from '@opentrons/components'

import { getOnlyLatestDefs } from '../../../labware-defs'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import {
  selectLid,
  selectTopLabware,
  selectTopLabwareAmount,
} from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import {
  getIsVacuumSpacer,
  getLabwareCompatibleWithAdapter,
  getStackerDefinitions,
} from '../../../pages/Designer/DeckSetup/utils'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { getPipetteEntities } from '../../../step-forms/selectors'
import { getHas96Channel } from '../../../utils'
import { ADAPTER_96_CHANNEL } from '../../../utils/labwareModuleCompatibility'
import { SelectLidOnLabware } from './SelectLidOnLabware'
import { getIsNestedDefinitionALid } from './utils'

import type { ChangeEvent } from 'react'
import type { StackingProps } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { ThunkDispatch } from '../../../types'

interface SelectLabwareOnAdapterProps {
  slot: string
  lidLoadNames: string[]
  parentLabwareURI: string
  isAdapter: boolean
  category: string
  loadName: string
  universalLid?: [string, LabwareDefinition2]
}
export function SelectLabwareOnAdapter(
  props: SelectLabwareOnAdapterProps
): JSX.Element | null {
  const {
    slot,
    lidLoadNames,
    parentLabwareURI,
    isAdapter,
    category,
    loadName,
    universalLid,
  } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const pipetteEntities = useSelector(getPipetteEntities)
  const has96Channel = getHas96Channel(pipetteEntities)
  const permittedTipracks = useSelector(stepFormSelectors.getPermittedTipracks)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const defs = getOnlyLatestDefs()
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedAdapterDefURI, selectedTopLabware, selectedLidLabware } =
    zoomedInSlotInfo

  const handleSelectLabware = (
    nestedDefUri: string,
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    e.stopPropagation()
    dispatch(
      selectTopLabware({
        labwareDefURI: nestedDefUri,
      })
    )
    dispatch(
      selectLid({
        labwareDefURI: null,
      })
    )
    dispatch(
      selectTopLabwareAmount({
        amount: 1,
      })
    )
  }

  return isAdapter &&
    parentLabwareURI === selectedAdapterDefURI &&
    getLabwareCompatibleWithAdapter(defs, loadName)?.length > 0 ? (
    <ListButtonAccordionContainer id={`nestedAccordionContainer_${loadName}`}>
      <ListButtonAccordion
        key={`${category}_${loadName}_accordion`}
        isNested
        mainHeadline={t('adapter_compatible_lab')}
        isExpanded={parentLabwareURI === selectedAdapterDefURI}
      >
        {has96Channel && loadName === ADAPTER_96_CHANNEL
          ? permittedTipracks.map((tiprackDefUri, index) => {
              const nestedDef =
                defs[tiprackDefUri] ?? customLabwareDefs[tiprackDefUri]
              const stackingLabwareDefUris = getStackerDefinitions(
                {
                  ...defs,
                  ...customLabwareDefs,
                },
                undefined,
                nestedDef.parameters.loadName,
                nestedDef.metadata.displayCategory
              )

              const stackingProps: StackingProps | null =
                stackingLabwareDefUris.length === 1 && slot !== 'offDeck'
                  ? {
                      inputTitle: t('labware_quantity'),
                      errorMessage: t('unsupported_range'),
                      checkboxCaption: t('with_lid', {
                        name: defs[stackingLabwareDefUris[0]].metadata
                          .displayName,
                      }),
                      checked: selectedLidLabware != null,
                      onCheckboxChange: () => {
                        dispatch(
                          selectLid({
                            labwareDefURI:
                              selectedLidLabware === stackingLabwareDefUris[0]
                                ? null
                                : stackingLabwareDefUris[0],
                          })
                        )
                      },
                      inputCaption: t('valid_range', {
                        max: defs[stackingLabwareDefUris[0]].stackLimit,
                      }),
                      definition: defs[stackingLabwareDefUris[0]],
                      inputFieldValue: selectedTopLabware.amount ?? 1,
                      onInputFieldChange: (e: ChangeEvent<any>) => {
                        dispatch(
                          selectTopLabwareAmount({
                            amount: parseInt(e.target.value as string),
                          })
                        )
                      },
                    }
                  : null

              return (
                <CustomizeExpandButton
                  isNestedDefALid={false}
                  allowInputField={false}
                  stackingProps={stackingProps ?? undefined}
                  key={`${category}_${loadName}_${tiprackDefUri}`}
                  id={`${index}_${category}_${loadName}_${tiprackDefUri}`}
                  buttonText={nestedDef?.metadata.displayName ?? ''}
                  buttonValue={tiprackDefUri}
                  onChange={e => {
                    e.stopPropagation()
                    dispatch(
                      selectTopLabware({
                        labwareDefURI: tiprackDefUri,
                      })
                    )
                  }}
                  isSelected={
                    tiprackDefUri === selectedTopLabware.labwareDefURI
                  }
                />
              )
            })
          : getLabwareCompatibleWithAdapter(
              {
                ...defs,
                ...customLabwareDefs,
              },

              loadName
            ).map(nestedDefUri => {
              const nestedDef =
                defs[nestedDefUri] ?? customLabwareDefs[nestedDefUri]

              // don't show lid option for vacuum module adapters
              const adapterDef =
                defs[parentLabwareURI] ?? customLabwareDefs[parentLabwareURI]
              const isVacuumModuleAdapter =
                adapterDef != null && getIsVacuumSpacer(adapterDef)

              const stackingLabwareDefUris = getStackerDefinitions(
                {
                  ...defs,
                  ...customLabwareDefs,
                },
                ...(isVacuumModuleAdapter ? [] : [universalLid?.[0]]),
                nestedDef.parameters.loadName,
                nestedDef.metadata.displayCategory
              )

              const stackingProps: StackingProps | null =
                stackingLabwareDefUris.length === 1 &&
                slot !== 'offDeck' &&
                !isVacuumModuleAdapter
                  ? {
                      inputTitle: t('labware_quantity'),
                      errorMessage: t('unsupported_range'),
                      checkboxCaption: t('with_lid', {
                        name: defs[stackingLabwareDefUris[0]].metadata
                          .displayName,
                      }),
                      checked: selectedLidLabware != null,
                      onCheckboxChange: () => {
                        dispatch(
                          selectLid({
                            labwareDefURI:
                              selectedLidLabware === stackingLabwareDefUris[0]
                                ? null
                                : stackingLabwareDefUris[0],
                          })
                        )
                      },
                      inputCaption: t('valid_range', {
                        max: defs[stackingLabwareDefUris[0]].stackLimit,
                      }),
                      definition: defs[stackingLabwareDefUris[0]],
                      inputFieldValue: selectedTopLabware.amount ?? 1,
                      onInputFieldChange: (e: ChangeEvent<any>) => {
                        dispatch(
                          selectTopLabwareAmount({
                            amount: parseInt(e.target.value as string),
                          })
                        )
                      },
                    }
                  : null

              return (
                <Fragment key={`${loadName}_${category}`}>
                  <CustomizeExpandButton
                    isNestedDefALid={getIsNestedDefinitionALid(nestedDef)}
                    allowInputField={lidLoadNames.includes(
                      nestedDef.parameters.loadName
                    )}
                    stackingProps={stackingProps ?? undefined}
                    key={`${category}_${loadName}_${nestedDefUri}`}
                    id={`${category}_${loadName}_${nestedDefUri}`}
                    buttonText={nestedDef?.metadata.displayName ?? ''}
                    buttonValue={nestedDefUri}
                    onChange={e => {
                      handleSelectLabware(nestedDefUri, e)
                    }}
                    isSelected={
                      nestedDefUri === selectedTopLabware.labwareDefURI
                    }
                  />
                  {!isVacuumModuleAdapter && (
                    <SelectLidOnLabware
                      lidLoadNames={lidLoadNames}
                      parentLabwareURI={nestedDefUri}
                      isAdapter={false}
                      category={category}
                      loadName={loadName}
                      lidURIs={stackingLabwareDefUris}
                    />
                  )}
                </Fragment>
              )
            })}
      </ListButtonAccordion>
    </ListButtonAccordionContainer>
  ) : null
}
