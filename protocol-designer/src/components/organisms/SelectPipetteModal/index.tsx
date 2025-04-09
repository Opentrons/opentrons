import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import {
  FLEX_ROBOT_TYPE,
  getAllPipetteNames,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import {
  ALIGN_CENTER,
  ALIGN_STRETCH,
  Box,
  Btn,
  Checkbox,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  DISPLAY_INLINE_BLOCK,
  Flex,
  OVERFLOW_AUTO,
  PRODUCT,
  RadioButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
  Modal,
  SecondaryButton,
  PrimaryButton,
  JUSTIFY_END,
} from '@opentrons/components'
import {
  PIPETTE_GENS,
  PIPETTE_TYPES,
  PIPETTE_VOLUMES,
} from '../../../pages/Onboarding/constants'
import { getAllowAllTipracks } from '../../../feature-flags/selectors'
import { useKitchen } from '../Kitchen/hooks'
import { getTiprackOptions } from '../../../pages/Onboarding/utils'
import { removeOpentronsPhrases } from '../../../utils'
import { createCustomTiprackDef } from '../../../labware-defs/actions'
import { setFeatureFlags } from '../../../feature-flags/actions'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { getMainPagePortalEl } from '../Portal'
import { IncompatibleTipsModal } from '../IncompatibleTipsModal'

import type { ThunkDispatch } from 'redux-thunk'
import type { Dispatch, SetStateAction } from 'react'

import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type {
  Gen,
  PipetteInfoByGen,
  PipetteInfoByType,
  PipetteType,
  WizardTileProps,
} from '../../../pages/Onboarding/types'
import type { BaseState } from '../../../types'

const MAX_TIPRACKS_ALLOWED = 3

interface SelectedPipetteModalProps extends WizardTileProps {
  mount: PipetteMount
  handleBack: () => void
  pipetteGen: Gen | 'flex'
  pipetteVolume: string | null
  pipetteType: PipetteType | null
  setPipetteGen: Dispatch<SetStateAction<'flex' | Gen>>
  setPipetteVolume: Dispatch<SetStateAction<string | null>>
  setPipetteType: Dispatch<SetStateAction<PipetteType | null>>
}

export function SelectPipetteModal(
  props: SelectedPipetteModalProps
): JSX.Element | null {
  const {
    handleBack,
    watch,
    setValue,
    mount,
    pipetteGen,
    pipetteType,
    pipetteVolume,
    setPipetteGen,
    setPipetteVolume,
    setPipetteType,
  } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const pipettesByMount = watch('pipettesByMount')
  const fields = watch('fields')
  const { makeSnackbar } = useKitchen()
  const allLabware = useSelector(getLabwareDefsByURI)
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const [showIncompatibleTip, setIncompatibleTip] = useState<boolean>(false)
  const allowAllTipracks = useSelector(getAllowAllTipracks)
  const allPipetteOptions = getAllPipetteNames('maxVolume', 'channels')
  const robotType = fields.robotType
  const selectedPipetteName =
    pipetteType === '96' || pipetteGen === 'GEN1'
      ? `${pipetteVolume}_${pipetteType}`
      : `${pipetteVolume}_${pipetteType}_${pipetteGen.toLowerCase()}`

  const selectedValues = pipettesByMount[mount].tiprackDefURI ?? []

  const noPipette =
    (pipettesByMount.left.pipetteName == null ||
      pipettesByMount.left.tiprackDefURI == null) &&
    (pipettesByMount.right.pipetteName == null ||
      pipettesByMount.right.tiprackDefURI == null)

  const isDisabled =
    (pipettesByMount[mount].tiprackDefURI == null && noPipette) ||
    ((pipettesByMount.left.tiprackDefURI == null ||
      pipettesByMount.left.tiprackDefURI.length === 0) &&
      (pipettesByMount.right.tiprackDefURI == null ||
        pipettesByMount.right.tiprackDefURI.length === 0))

  const handleProceed = (): void => {
    setValue(`pipettesByMount.${mount}.pipetteName`, selectedPipetteName)
    handleBack()
  }

  if (robotType == null) {
    return null
  }

  return createPortal(
    showIncompatibleTip ? (
      <IncompatibleTipsModal
        onClose={() => {
          setIncompatibleTip(false)
        }}
      />
    ) : (
      <Modal
        marginLeft="0"
        width="37.125rem"
        type="info"
        title={t('add_pipette')}
        footer={
          <Flex
            justifyContent={JUSTIFY_END}
            gridGap={SPACING.spacing8}
            padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
            alignItems={ALIGN_CENTER}
          >
            <SecondaryButton onClick={handleBack}>
              {t('shared:cancel')}
            </SecondaryButton>
            <PrimaryButton onClick={handleProceed} disabled={isDisabled}>
              {t('shared:save')}
            </PrimaryButton>
          </Flex>
        }
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          overflowY={OVERFLOW_AUTO}
          gridGap={SPACING.spacing32}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
            <StyledText desktopStyle="headingSmallBold">
              {t('pipette_type')}
            </StyledText>
            <Flex gridGap={SPACING.spacing4} flexWrap={WRAP}>
              {PIPETTE_TYPES[robotType].map(type => {
                return type.value === '96' &&
                  (mount === 'right' ||
                    (mount === 'left' &&
                      pipettesByMount.right.pipetteName != null)) ? null : (
                  <RadioButton
                    key={`${type.label}_${type.value}`}
                    onChange={() => {
                      setPipetteType(type.value)
                      setPipetteGen('flex')
                      setPipetteVolume(null)
                      setValue(
                        `pipettesByMount.${mount}.pipetteName`,
                        undefined
                      )
                      setValue(
                        `pipettesByMount.${mount}.tiprackDefURI`,
                        undefined
                      )
                    }}
                    buttonLabel={t(`shared:${type.label}`)}
                    buttonValue="single"
                    isSelected={pipetteType === type.value}
                  />
                )
              })}
            </Flex>
          </Flex>

          {pipetteType != null && robotType === OT2_ROBOT_TYPE ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing12}
              flexWrap={WRAP}
            >
              <StyledText desktopStyle="headingSmallBold">
                {t('pipette_gen')}
              </StyledText>
              <Flex gridGap={SPACING.spacing4}>
                {PIPETTE_GENS.map(gen => (
                  <RadioButton
                    key={gen}
                    onChange={() => {
                      setPipetteGen(gen)
                      setPipetteVolume(null)
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
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
              <StyledText desktopStyle="headingSmallBold">
                {t('pipette_vol')}
              </StyledText>
              <Flex gridGap={SPACING.spacing4} flexWrap={WRAP}>
                {PIPETTE_VOLUMES[robotType]?.map(volume => {
                  if (robotType === FLEX_ROBOT_TYPE && pipetteType != null) {
                    const flexVolume = volume as PipetteInfoByType
                    const flexPipetteInfo = flexVolume[pipetteType]

                    return flexPipetteInfo?.map(type => (
                      <RadioButton
                        key={`${type.value}_${pipetteType}`}
                        onChange={() => {
                          setPipetteVolume(type.value)
                        }}
                        buttonLabel={t('vol_label', { volume: type.label })}
                        buttonValue={type.value}
                        isSelected={pipetteVolume === type.value}
                      />
                    ))
                  } else {
                    const ot2Volume = volume as PipetteInfoByGen
                    //  asserting gen is defined from previous turnary statement
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
          {allPipetteOptions.includes(selectedPipetteName as PipetteName)
            ? (() => {
                const tiprackOptions = getTiprackOptions({
                  allLabware,
                  allowAllTipracks,
                  selectedPipetteName,
                })
                return (
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    gridGap={SPACING.spacing4}
                  >
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={SPACING.spacing16}
                    >
                      <StyledText desktopStyle="headingSmallBold">
                        {t('pipette_tips')}
                      </StyledText>
                      <Box
                        css={css`
                          gap: ${SPACING.spacing4};
                          display: ${DISPLAY_FLEX};
                          flex-wrap: ${WRAP};
                          align-items: ${ALIGN_CENTER};
                          align-content: ${ALIGN_CENTER};
                          align-self: ${ALIGN_STRETCH};
                        `}
                      >
                        {Object.entries(tiprackOptions).map(([value, name]) => (
                          <Checkbox
                            key={value}
                            isChecked={selectedValues.includes(value)}
                            labelText={removeOpentronsPhrases(name)}
                            onClick={() => {
                              const isCurrentlySelected = selectedValues.includes(
                                value
                              )

                              if (isCurrentlySelected) {
                                setValue(
                                  `pipettesByMount.${mount}.tiprackDefURI`,
                                  selectedValues.filter(v => v !== value)
                                )
                              } else {
                                if (
                                  selectedValues.length === MAX_TIPRACKS_ALLOWED
                                ) {
                                  makeSnackbar(t('up_to_3_tipracks') as string)
                                } else {
                                  setValue(
                                    `pipettesByMount.${mount}.tiprackDefURI`,
                                    [...selectedValues, value]
                                  )
                                }
                              }
                            }}
                          />
                        ))}
                        <StyledLabel>
                          <StyledText
                            desktopStyle="bodyDefaultRegular"
                            padding={SPACING.spacing4}
                          >
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
                              if (allowAllTipracks) {
                                dispatch(
                                  setFeatureFlags({
                                    OT_PD_ALLOW_ALL_TIPRACKS: !allowAllTipracks,
                                  })
                                )
                              } else {
                                setIncompatibleTip(true)
                              }
                            }}
                            textDecoration={TYPOGRAPHY.textDecorationUnderline}
                          >
                            <StyledLabel>
                              <StyledText
                                desktopStyle="bodyDefaultRegular"
                                padding={SPACING.spacing4}
                              >
                                {allowAllTipracks
                                  ? t('show_default_tips')
                                  : t('show_all_tips')}
                              </StyledText>
                            </StyledLabel>
                          </Btn>
                        )}
                      </Box>
                    </Flex>
                  </Flex>
                )
              })()
            : null}
        </Flex>
      </Modal>
    ),
    getMainPagePortalEl()
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
  &:hover {
    color: ${COLORS.blue50};
  }
`
