import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  getAllPipetteNames,
} from '@opentrons/shared-data'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  RadioButton,
  Box,
  Checkbox,
  TYPOGRAPHY,
  Btn,
  JUSTIFY_SPACE_BETWEEN,
  EmptySelectorButton,
  ALIGN_CENTER,
} from '@opentrons/components'
import { getAllowAllTipracks } from '../../feature-flags/selectors'
import { getLabwareDefsByURI } from '../../labware-defs/selectors'
import { getTiprackOptions } from '../../components/modals/utils'
import { setFeatureFlags } from '../../feature-flags/actions'
import { createCustomTiprackDef } from '../../labware-defs/actions'
import { PipetteInfoItem } from './PipetteInfoItem'
import { WizardBody } from './WizardBody'
import { PIPETTE_GENS, PIPETTE_TYPES, PIPETTE_VOLUMES } from './constants'

import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type { ThunkDispatch } from 'redux-thunk'
import type { BaseState } from '../../types'
import type {
  Gen,
  PipetteInfoByGen,
  PipetteInfoByType,
  PipetteType,
  WizardTileProps,
} from './types'

export function SelectPipettes(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch, setValue } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const pipettesByMount = watch('pipettesByMount')
  const fields = watch('fields')
  const allLabware = useSelector(getLabwareDefsByURI)
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const [mount, setMount] = React.useState<PipetteMount | null>(null)
  const [page, setPage] = React.useState<'add' | 'overview'>('add')
  const [pipetteType, setPipetteType] = React.useState<PipetteType | null>(null)
  const [pipetteGen, setPipetteGen] = React.useState<Gen | 'flex'>('flex')
  const [pipetteVolume, setPipetteVolume] = React.useState<string | null>(null)
  const allowAllTipracks = useSelector(getAllowAllTipracks)
  const allPipetteOptions = getAllPipetteNames('maxVolume', 'channels')
  const robotType = fields.robotType ?? OT2_ROBOT_TYPE
  const selectedPip =
    pipetteType === '96' || pipetteGen === 'GEN1'
      ? `${pipetteVolume}_${pipetteType}`
      : `${pipetteVolume}_${pipetteType}_${pipetteGen.toLowerCase()}`

  const selectedValues = pipettesByMount[mount ?? 'left'].tiprackDefURI ?? []

  const resetFields = (): void => {
    setPipetteType(null)
    setPipetteGen('flex')
    setPipetteVolume(null)
    setValue(`pipettesByMount.${mount ?? 'left'}.pipetteName`, undefined)
    setValue(`pipettesByMount.${mount ?? 'left'}.tiprackDefURI`, undefined)
  }

  //    initialize pipette name once all fields are filled out
  React.useEffect(() => {
    if (pipetteType != null && pipetteVolume != null) {
      setValue(`pipettesByMount.${mount ?? 'left'}.pipetteName`, selectedPip)
    }
  }, [pipetteType, pipetteGen, pipetteVolume, selectedPip])

  return (
    <WizardBody
      stepNumber={2}
      header={page === 'add' ? t('add_pip') : t('robot_pips')}
      subHeader={page === 'add' ? t('which_pip') : undefined}
      proceed={() => {
        if (page === 'overview') {
          proceed(1)
        } else {
          setPage('overview')
        }
      }}
      goBack={() => {
        if (page === 'add') {
          resetFields()
          goBack(1)
        } else {
          setPage('add')
        }
      }}
      disabled={
        page === 'add' && pipettesByMount[mount ?? 'left'].tiprackDefURI == null
      }
    >
      {page === 'add' ? (
        <Flex
          flexDirection="column"
          height="48vh"
          overflowY="scroll"
          marginBottom={SPACING.spacing40}
        >
          <>
            <StyledText
              desktopStyle="headingSmallBold"
              marginBottom={SPACING.spacing16}
            >
              {t('pip_type')}
            </StyledText>
            <Flex gridGap={SPACING.spacing4}>
              {PIPETTE_TYPES[robotType].map(type => (
                <RadioButton
                  key={`${type.label}_${type.value}`}
                  onChange={() => {
                    setPipetteType(type.value)
                    setPipetteGen('flex')
                    setPipetteVolume(null)
                    setValue(
                      `pipettesByMount.${mount ?? 'left'}.pipetteName`,
                      undefined
                    )
                    setValue(
                      `pipettesByMount.${mount ?? 'left'}.tiprackDefURI`,
                      undefined
                    )
                  }}
                  buttonLabel={t(`shared:${type.label}`)}
                  buttonValue="single"
                  isSelected={pipetteType === type.value}
                />
              ))}
            </Flex>
          </>
          {pipetteType != null && robotType === OT2_ROBOT_TYPE ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginTop={SPACING.spacing32}
            >
              <StyledText
                desktopStyle="headingSmallBold"
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
          (pipetteGen != 'flex' &&
            pipetteType != null &&
            robotType === OT2_ROBOT_TYPE) ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginTop={SPACING.spacing32}
            >
              <StyledText
                desktopStyle="headingSmallBold"
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
                          buttonLabel={t('vol_label', { volume: type.label })}
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
                    marginTop={SPACING.spacing32}
                  >
                    <StyledText
                      desktopStyle="headingSmallBold"
                      marginBottom={SPACING.spacing16}
                    >
                      {t('pip_tips')}
                    </StyledText>
                    <Box
                      css={css`
                        gap: ${SPACING.spacing4};
                        display: flex;
                        flex-wrap: wrap;
                      `}
                    >
                      {tiprackOptions.map(option => (
                        <Checkbox
                          key={option.value}
                          isChecked={selectedValues.includes(option.value)}
                          labelText={option.name}
                          onClick={() => {
                            const updatedValues = selectedValues?.includes(
                              option.value
                            )
                              ? selectedValues.filter(
                                  value => value !== option.value
                                )
                              : [...(selectedValues ?? []), option.value]
                            setValue(
                              `pipettesByMount.${
                                mount ?? 'left'
                              }.tiprackDefURI`,
                              updatedValues.slice(0, 3)
                            )
                          }}
                        />
                      ))}
                    </Box>
                    <Flex
                      gridGap={SPACING.spacing8}
                      marginTop={SPACING.spacing4}
                    >
                      <StyledLabel>
                        <StyledText as="bodyDefaultRegular">
                          {t('add_custom_tips')}
                        </StyledText>
                        <input
                          type="file"
                          onChange={e => dispatch(createCustomTiprackDef(e))}
                        />
                      </StyledLabel>
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
                        <StyledText as="bodyDefaultRegular">
                          {allowAllTipracks
                            ? t('show_default_tips')
                            : t('show_all_tips')}
                        </StyledText>
                      </Btn>
                    </Flex>
                  </Flex>
                )
              })()
            : null}
        </Flex>
      ) : (
        <Flex marginTop={SPACING.spacing60} flexDirection={DIRECTION_COLUMN}>
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginBottom={SPACING.spacing12}
            alignItems={ALIGN_CENTER}
          >
            <StyledText desktopStyle="headingSmallBold">
              {t('your_pips')}
            </StyledText>
            <Btn
              onClick={() => {
                const leftPipetteName = pipettesByMount.left.pipetteName
                const rightPipetteName = pipettesByMount.right.pipetteName
                const leftTiprackDefURI = pipettesByMount.left.tiprackDefURI
                const rightTiprackDefURI = pipettesByMount.right.tiprackDefURI

                setValue('pipettesByMount.left.pipetteName', rightPipetteName)
                setValue('pipettesByMount.right.pipetteName', leftPipetteName)
                setValue(
                  'pipettesByMount.left.tiprackDefURI',
                  rightTiprackDefURI
                )
                setValue(
                  'pipettesByMount.right.tiprackDefURI',
                  leftTiprackDefURI
                )
              }}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('swap')}
              </StyledText>
            </Btn>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {pipettesByMount.left.pipetteName != null &&
            pipettesByMount.left.tiprackDefURI != null ? (
              <PipetteInfoItem
                mount="left"
                pipetteName={pipettesByMount.left.pipetteName as PipetteName}
                tiprackDefURIs={pipettesByMount.left.tiprackDefURI}
                editClick={() => {
                  setPage('add')
                  setMount('left')
                }}
                setValue={setValue}
                cleanForm={resetFields}
                watch={watch}
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
            {pipettesByMount.right.pipetteName != null &&
            pipettesByMount.right.tiprackDefURI != null ? (
              <PipetteInfoItem
                mount="right"
                watch={watch}
                pipetteName={pipettesByMount.right.pipetteName as PipetteName}
                tiprackDefURIs={pipettesByMount.right.tiprackDefURI}
                editClick={() => {
                  setPage('add')
                  setMount('right')
                }}
                setValue={setValue}
                cleanForm={resetFields}
              />
            ) : (
              <EmptySelectorButton
                onClick={() => {
                  setPage('add')
                  setMount('right')
                  resetFields()
                }}
                text={t('add_pip')}
                textAlignment="left"
                iconName="plus"
                size="large"
              />
            )}
          </Flex>
        </Flex>
      )}
    </WizardBody>
  )
}

const StyledLabel = styled.label`
  text-decoration: underline;
  font-size: 0.875rem;
  display: inline-block;
  cursor: pointer;
  input[type='file'] {
    display: none;
  }
`
