import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import styled, { css } from 'styled-components'
import mapValues from 'lodash/mapValues'
import {
  ALIGN_CENTER,
  Box,
  Btn,
  Checkbox,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  DISPLAY_INLINE_BLOCK,
  EmptySelectorButton,
  Flex,
  Icon,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  Modal,
  PrimaryButton,
  PRODUCT,
  RadioButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  getAllPipetteNames,
} from '@opentrons/shared-data'
import { getTopPortalEl } from '../../components/portals/TopPortal'
import { getAllowAllTipracks } from '../../feature-flags/selectors'
import {
  getAdditionalEquipment,
  getInitialDeckSetup,
  getPipetteEntities,
} from '../../step-forms/selectors'
import { getHas96Channel } from '../../utils'
import { changeSavedStepForm } from '../../steplist/actions'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../constants'
import { PipetteInfoItem } from '../PipetteInfoItem'
import { deletePipettes } from '../../step-forms/actions'
import { toggleIsGripperRequired } from '../../step-forms/actions/additionalItems'
import { getRobotType } from '../../file-data/selectors'
import {
  PIPETTE_GENS,
  PIPETTE_TYPES,
  PIPETTE_VOLUMES,
} from '../../pages/CreateNewProtocolWizard/constants'
import { getTiprackOptions } from '../../components/modals/utils'
import { getLabwareDefsByURI } from '../../labware-defs/selectors'
import { setFeatureFlags } from '../../feature-flags/actions'
import { createCustomTiprackDef } from '../../labware-defs/actions'
import { deleteContainer } from '../../labware-ingred/actions'
import { selectors as stepFormSelectors } from '../../step-forms'
import { BUTTON_LINK_STYLE } from '../../atoms'
import { getSectionsFromPipetteName } from './utils'
import { editPipettes } from './editPipettes'
import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type {
  Gen,
  PipetteInfoByGen,
  PipetteInfoByType,
  PipetteType,
} from '../../pages/CreateNewProtocolWizard/types'
import type { ThunkDispatch } from '../../types'

interface EditInstrumentsModalProps {
  onClose: () => void
}

export function EditInstrumentsModal(
  props: EditInstrumentsModalProps
): JSX.Element {
  const { onClose } = props
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation([
    'create_new_protocol',
    'protocol_overview',
    'shared',
  ])
  const [page, setPage] = useState<'add' | 'overview'>('overview')
  const [mount, setMount] = useState<PipetteMount>('left')
  const [pipetteType, setPipetteType] = useState<PipetteType | null>(null)
  const [pipetteGen, setPipetteGen] = useState<Gen | 'flex'>('flex')
  const [pipetteVolume, setPipetteVolume] = useState<string | null>(null)
  const [selectedTips, setSelectedTips] = useState<string[]>([])
  const allowAllTipracks = useSelector(getAllowAllTipracks)
  const robotType = useSelector(getRobotType)
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const pipetteEntities = useSelector(getPipetteEntities)
  const allLabware = useSelector(getLabwareDefsByURI)
  const allPipetteOptions = getAllPipetteNames('maxVolume', 'channels')
  const { pipettes, labware } = initialDeckSetup
  const pipettesOnDeck = Object.values(pipettes)
  const has96Channel = getHas96Channel(pipetteEntities)
  const leftPip = pipettesOnDeck.find(pip => pip.mount === 'left')
  const rightPip = pipettesOnDeck.find(pip => pip.mount === 'right')
  const gripper = Object.values(additionalEquipment).find(
    ae => ae.name === 'gripper'
  )
  const selectedPip =
    pipetteType === '96' || pipetteGen === 'GEN1'
      ? `${pipetteVolume}_${pipetteType}`
      : `${pipetteVolume}_${pipetteType}_${pipetteGen.toLowerCase()}`

  const swapPipetteUpdate = mapValues(pipettes, pipette => {
    if (!pipette.mount) return pipette.mount
    return pipette.mount === 'left' ? 'right' : 'left'
  })

  const resetFields = (): void => {
    setPipetteType(null)
    setPipetteGen('flex')
    setPipetteVolume(null)
  }

  const previousLeftPipetteTipracks = Object.values(labware)
    .filter(lw => lw.def.parameters.isTiprack)
    .filter(tip => leftPip?.tiprackDefURI.includes(tip.labwareDefURI))
  const previousRightPipetteTipracks = Object.values(labware)
    .filter(lw => lw.def.parameters.isTiprack)
    .filter(tip => rightPip?.tiprackDefURI.includes(tip.labwareDefURI))

  const rightInfo =
    rightPip != null
      ? getSectionsFromPipetteName(rightPip.name, rightPip.spec)
      : null
  const leftInfo =
    leftPip != null
      ? getSectionsFromPipetteName(leftPip.name, leftPip.spec)
      : null

  return createPortal(
    <Modal
      title={t('shared:edit_instruments')}
      type="info"
      closeOnOutsideClick
      onClose={() => {
        resetFields()
        onClose()
      }}
      footer={
        <Flex
          justifyContent={JUSTIFY_END}
          gridGap={SPACING.spacing8}
          padding={SPACING.spacing24}
        >
          {page === 'overview' ? null : (
            <SecondaryButton
              onClick={() => {
                setPage('overview')
                resetFields()
              }}
            >
              {t('shared:cancel')}
            </SecondaryButton>
          )}
          <PrimaryButton
            disabled={
              page === 'add' &&
              (pipetteVolume == null ||
                pipetteType == null ||
                pipetteGen == null ||
                selectedTips.length === 0)
            }
            onClick={() => {
              if (page === 'overview') {
                onClose()
              } else {
                setPage('overview')
                editPipettes(
                  labware,
                  pipettes,
                  orderedStepIds,
                  dispatch,
                  mount,
                  selectedPip as PipetteName,
                  selectedTips,
                  leftPip,
                  rightPip
                )
              }
            }}
          >
            {t(page === 'overview' ? 'shared:close' : 'shared:save')}
          </PrimaryButton>
        </Flex>
      }
    >
      {page === 'overview' ? (
        <>
          <Flex marginTop={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              marginBottom={SPACING.spacing12}
              alignItems={ALIGN_CENTER}
            >
              <StyledText desktopStyle="bodyLargeSemiBold">
                {t('your_pips')}
              </StyledText>
              {has96Channel ? null : (
                <Btn
                  css={BUTTON_LINK_STYLE}
                  onClick={() =>
                    dispatch(
                      changeSavedStepForm({
                        stepId: INITIAL_DECK_SETUP_STEP_ID,
                        update: {
                          pipetteLocationUpdate: swapPipetteUpdate,
                        },
                      })
                    )
                  }
                >
                  <Flex flexDirection={DIRECTION_ROW}>
                    <Icon
                      name="swap-horizontal"
                      size="1rem"
                      transform="rotate(90deg)"
                    />
                    <StyledText desktopStyle="captionSemiBold">
                      {t('swap')}
                    </StyledText>
                  </Flex>
                </Btn>
              )}
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              {leftPip != null &&
              leftPip.tiprackDefURI != null &&
              leftInfo != null ? (
                <PipetteInfoItem
                  mount="left"
                  pipetteOnDeck={pipettesOnDeck}
                  pipetteName={leftPip.name}
                  tiprackDefURIs={leftPip.tiprackDefURI}
                  editClick={() => {
                    setPage('add')
                    setMount('left')
                    setPipetteType(leftInfo.type)
                    setPipetteGen(leftInfo.gen)
                    setPipetteVolume(leftInfo.volume)
                    setSelectedTips(leftPip.tiprackDefURI)
                  }}
                  cleanForm={() => {
                    dispatch(deletePipettes([leftPip.id]))
                    previousLeftPipetteTipracks.forEach(tip =>
                      dispatch(deleteContainer({ labwareId: tip.id }))
                    )
                  }}
                />
              ) : (
                <EmptySelectorButton
                  onClick={() => {
                    setPage('add')
                    setMount('left')
                    resetFields()
                  }}
                  text={t('add_pip')}
                  textAlignment="left"
                  iconName="plus"
                  size="large"
                />
              )}
              {rightPip != null &&
              rightPip.tiprackDefURI != null &&
              rightInfo != null ? (
                <PipetteInfoItem
                  mount="right"
                  pipetteOnDeck={pipettesOnDeck}
                  pipetteName={rightPip.name}
                  tiprackDefURIs={rightPip.tiprackDefURI}
                  editClick={() => {
                    setPage('add')
                    setMount('right')
                    setPipetteType(rightInfo.type)
                    setPipetteGen(rightInfo.gen)
                    setPipetteVolume(rightInfo.volume)
                    setSelectedTips(rightPip.tiprackDefURI)
                  }}
                  cleanForm={() => {
                    dispatch(deletePipettes([rightPip.id]))
                    previousRightPipetteTipracks.forEach(tip =>
                      dispatch(deleteContainer({ labwareId: tip.id }))
                    )
                  }}
                />
              ) : has96Channel ? null : (
                <EmptySelectorButton
                  onClick={() => {
                    setPage('add')
                    setMount('right')
                  }}
                  text={t('add_pip')}
                  textAlignment="left"
                  iconName="plus"
                  size="large"
                />
              )}
            </Flex>
          </Flex>
          {robotType === FLEX_ROBOT_TYPE ? (
            <Flex
              marginTop={SPACING.spacing60}
              flexDirection={DIRECTION_COLUMN}
            >
              <Flex
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                marginBottom={SPACING.spacing12}
                alignItems={ALIGN_CENTER}
              >
                <StyledText desktopStyle="bodyLargeSemiBold">
                  {t('protocol_overview:your_gripper')}
                </StyledText>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
                {gripper != null ? (
                  <ListItem type="noActive">
                    <Flex
                      padding={SPACING.spacing12}
                      justifyContent={JUSTIFY_SPACE_BETWEEN}
                      width="100%"
                    >
                      <Flex
                        gridGap={SPACING.spacing4}
                        flexDirection={DIRECTION_COLUMN}
                      >
                        <StyledText desktopStyle="bodyDefaultSemiBold">
                          {t('protocol_overview:extension')}
                        </StyledText>
                        <StyledText
                          desktopStyle="bodyDefaultRegular"
                          color={COLORS.grey60}
                        >
                          {t('gripper')}
                        </StyledText>
                      </Flex>
                      <Btn
                        css={BUTTON_LINK_STYLE}
                        textDecoration={TYPOGRAPHY.textDecorationUnderline}
                        onClick={() => {
                          dispatch(toggleIsGripperRequired())
                        }}
                      >
                        <StyledText desktopStyle="bodyDefaultRegular">
                          {t('remove')}
                        </StyledText>
                      </Btn>
                    </Flex>
                  </ListItem>
                ) : (
                  <EmptySelectorButton
                    onClick={() => {
                      dispatch(toggleIsGripperRequired())
                    }}
                    text={t('protocol_overview:add_gripper')}
                    textAlignment="left"
                    iconName="plus"
                    size="large"
                  />
                )}
              </Flex>
            </Flex>
          ) : null}
        </>
      ) : (
        <Flex
          flexDirection="column"
          overflowY="scroll"
          marginTop={SPACING.spacing24}
        >
          <>
            <StyledText
              desktopStyle="bodyLargeSemiBold"
              marginBottom={SPACING.spacing16}
            >
              {t('pip_type')}
            </StyledText>
            <Flex gridGap={SPACING.spacing4}>
              {PIPETTE_TYPES[robotType].map(type => {
                return type.value === '96' && has96Channel ? null : (
                  <RadioButton
                    key={`${type.label}_${type.value}`}
                    onChange={() => {
                      setPipetteType(type.value)
                      setPipetteGen('flex')
                      setPipetteVolume(null)
                      setSelectedTips([])
                    }}
                    buttonLabel={t(`shared:${type.label}`)}
                    buttonValue="single"
                    isSelected={pipetteType === type.value}
                  />
                )
              })}
            </Flex>
          </>
          {pipetteType != null && robotType === OT2_ROBOT_TYPE ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginBottom={SPACING.spacing16}
            >
              <StyledText
                desktopStyle="bodyLargeSemiBold"
                marginBottom={SPACING.spacing16}
              >
                {t('pip_gen')}
              </StyledText>
              <Flex gridGap={SPACING.spacing4}>
                {PIPETTE_GENS.map(gen => (
                  <RadioButton
                    key={gen}
                    onChange={() => {
                      setPipetteGen(gen)
                      setPipetteVolume(null)
                      setSelectedTips([])
                    }}
                    buttonLabel={gen}
                    buttonValue={gen}
                    isSelected={pipetteGen === gen}
                  />
                ))}
              </Flex>
            </Flex>
          ) : null}
          {(pipetteType != null && robotType === FLEX_ROBOT_TYPE) ||
          (pipetteGen !== 'flex' &&
            pipetteType != null &&
            robotType === OT2_ROBOT_TYPE) ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginTop={SPACING.spacing16}
            >
              <StyledText
                desktopStyle="bodyLargeSemiBold"
                marginBottom={SPACING.spacing16}
              >
                {t('pip_vol')}
              </StyledText>
              <Flex gridGap={SPACING.spacing4}>
                {PIPETTE_VOLUMES[robotType]?.map(volume => {
                  if (robotType === FLEX_ROBOT_TYPE && pipetteType != null) {
                    const flexVolume = volume as PipetteInfoByType
                    const flexPipetteInfo = flexVolume[pipetteType]

                    return flexPipetteInfo?.map(type => (
                      <RadioButton
                        key={`${type.value}_${pipetteType}`}
                        onChange={() => {
                          setPipetteVolume(type.value)
                          setSelectedTips([])
                        }}
                        buttonLabel={t('vol_label', { volume: type.label })}
                        buttonValue={type.value}
                        isSelected={pipetteVolume === type.value}
                      />
                    ))
                  } else {
                    const ot2Volume = volume as PipetteInfoByGen
                    const gen = pipetteGen as Gen

                    return ot2Volume[gen].map(info => {
                      return info[pipetteType]?.map(type => (
                        <RadioButton
                          key={`${type.value}_${pipetteGen}_${pipetteType}`}
                          onChange={() => {
                            setPipetteVolume(type.value)
                          }}
                          buttonLabel={t('vol_label', {
                            volume: type.label,
                          })}
                          buttonValue={type.value}
                          isSelected={pipetteVolume === type.value}
                        />
                      ))
                    })
                  }
                })}
              </Flex>
            </Flex>
          ) : null}
          {allPipetteOptions.includes(selectedPip as PipetteName)
            ? (() => {
                const tiprackOptions = getTiprackOptions({
                  allLabware: allLabware,
                  allowAllTipracks: allowAllTipracks,
                  selectedPipetteName: selectedPip,
                })
                return (
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    marginTop={SPACING.spacing16}
                  >
                    <StyledText
                      desktopStyle="bodyLargeSemiBold"
                      marginBottom={SPACING.spacing16}
                    >
                      {t('pip_tips')}
                    </StyledText>
                    <Box
                      css={css`
                        gap: ${SPACING.spacing4};
                        display: ${DISPLAY_FLEX};
                        flex-wrap: ${WRAP};
                      `}
                    >
                      {tiprackOptions.map(option => (
                        <Checkbox
                          key={option.value}
                          disabled={
                            selectedTips.length === 3 &&
                            !selectedTips.includes(option.value)
                          }
                          isChecked={selectedTips.includes(option.value)}
                          labelText={option.name}
                          onClick={() => {
                            const updatedTips = selectedTips.includes(
                              option.value
                            )
                              ? selectedTips.filter(v => v !== option.value)
                              : [...selectedTips, option.value]
                            setSelectedTips(updatedTips)
                          }}
                        />
                      ))}
                    </Box>
                    <Flex
                      gridGap={SPACING.spacing8}
                      marginTop={SPACING.spacing4}
                    >
                      <StyledLabel>
                        <StyledText desktopStyle="bodyDefaultRegular">
                          {t('add_custom_tips')}
                        </StyledText>
                        <input
                          data-testid="SelectPipettes_customTipInput"
                          type="file"
                          onChange={e => dispatch(createCustomTiprackDef(e))}
                        />
                      </StyledLabel>
                      {pipetteVolume === 'p1000' &&
                      robotType === FLEX_ROBOT_TYPE ? null : (
                        <Btn
                          onClick={() => {
                            dispatch(
                              setFeatureFlags({
                                OT_PD_ALLOW_ALL_TIPRACKS: !allowAllTipracks,
                              })
                            )
                          }}
                          textDecoration={TYPOGRAPHY.textDecorationUnderline}
                        >
                          <StyledText desktopStyle="bodyDefaultRegular">
                            {allowAllTipracks
                              ? t('show_default_tips')
                              : t('show_all_tips')}
                          </StyledText>
                        </Btn>
                      )}
                    </Flex>
                  </Flex>
                )
              })()
            : null}
        </Flex>
      )}
    </Modal>,
    getTopPortalEl()
  )
}

const StyledLabel = styled.label`
  text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
  font-size: ${PRODUCT.TYPOGRAPHY.fontSizeBodyDefaultSemiBold};
  display: ${DISPLAY_INLINE_BLOCK};
  cursor: ${CURSOR_POINTER};
  input[type='file'] {
    display: none;
  }
`
