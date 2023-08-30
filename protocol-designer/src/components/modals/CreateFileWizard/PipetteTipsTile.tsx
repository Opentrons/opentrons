import * as React from 'react'
import { css } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { FormikProps } from 'formik'
import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  SPACING,
  Mount,
  ALIGN_CENTER,
  PrimaryButton,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  ALIGN_START,
  BORDERS,
  DIRECTION_ROW,
  COLORS,
  OutlineButton,
  Icon,
  JUSTIFY_CENTER,
  WRAP,
  Btn,
  JUSTIFY_END,
} from '@opentrons/components'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { createCustomTiprackDef } from '../../../labware-defs/actions'
import { getAllowAllTipracks } from '../../../feature-flags/selectors'
import { getTiprackOptions } from '../utils'
import { GoBack } from './GoBack'
import { EquipmentOption } from './EquipmentOption'
import { HandleEnter } from './HandleEnter'

import type { PipetteName } from '@opentrons/shared-data'
import type { FormState, WizardTileProps } from './types'

export function FirstPipetteTipsTile(props: WizardTileProps): JSX.Element {
  return <PipetteTipsTile {...props} mount="left" />
}
export function SecondPipetteTipsTile(
  props: WizardTileProps
): JSX.Element | null {
  const { values, proceed } = props
  const leftPipetteName = values.pipettesByMount.left.pipetteName
  const rightPipetteName = values.pipettesByMount.right.pipetteName

  const shouldProceed =
    leftPipetteName === 'p1000_96' || rightPipetteName === ''

  if (shouldProceed) {
    proceed()
    return null
  }

  return <PipetteTipsTile {...props} mount="right" />
}

interface PipetteTipsTileProps extends WizardTileProps {
  mount: Mount
}
export function PipetteTipsTile(props: PipetteTipsTileProps): JSX.Element {
  const { proceed, goBack, mount, values } = props

  const firstPipetteName = values.pipettesByMount[mount].pipetteName
  const tileHeader = i18n.t(
    'modal.create_file_wizard.choose_tips_for_pipette',
    {
      pipetteName:
        firstPipetteName != null
          ? getPipetteNameSpecs(firstPipetteName as PipetteName)?.displayName ??
            ''
          : '',
    }
  )
  return (
    <HandleEnter onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          height="25.5rem"
          gridGap={SPACING.spacing32}
        >
          <Text as="h2">{tileHeader}</Text>
          <PipetteTipsField {...props} />
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
          paddingTop={SPACING.spacing8}
        >
          <GoBack onClick={() => goBack()} />
          <PrimaryButton onClick={() => proceed()}>
            {i18n.t('application.next')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </HandleEnter>
  )
}

const INPUT_STYLE = css`
  background-color: ${COLORS.blueEnabled};
  border-radius: ${BORDERS.radiusRoundEdge};
  box-shadow: none;
  color: ${COLORS.fundamentalsBackground};
  overflow: no-wrap;
  padding-left: ${SPACING.spacing16};
  padding-right: ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  white-space: nowrap;
  border: none;
  padding-top: 8px;
  ${TYPOGRAPHY.labelSemiBold}
  height: max-content;
  width: auto;
  font-size: ${TYPOGRAPHY.fontSizeP};
  input {
    display: none;
  }

  &:hover {
    background-color: ${COLORS.blueHover};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.bluePressed};
  }
`

const ACCORDION_STYLE = css`
  border-radius: 50%;
  &:hover {
    background: ${COLORS.lightGreyHover};
  }
  &:active {
    background: ${COLORS.lightGreyPressed};
  }
`
interface PipetteTipsFieldProps extends FormikProps<FormState> {
  mount: Mount
}

function PipetteTipsField(props: PipetteTipsFieldProps): JSX.Element | null {
  const { mount, values, setFieldValue } = props
  const allowAllTipracks = useSelector(getAllowAllTipracks)
  const dispatch = useDispatch()
  const [showCustomTipracks, setShowCustomTipracks] = React.useState<boolean>(
    false
  )
  const allLabware = useSelector(getLabwareDefsByURI)
  const selectedPipetteName = values.pipettesByMount[mount].pipetteName
  const selectedPipetteDefaultTipracks =
    selectedPipetteName != null
      ? getPipetteNameSpecs(selectedPipetteName as PipetteName)
          ?.defaultTipracks ?? []
      : []
  const tiprackOptions = getTiprackOptions({
    allLabware: allLabware,
    allowAllTipracks: allowAllTipracks,
    selectedPipetteName: selectedPipetteName,
  })

  const defaultTiprackOptions = tiprackOptions.filter(option =>
    allowAllTipracks
      ? !option.value.includes('custom_beta')
      : selectedPipetteDefaultTipracks.includes(option.value)
  )

  const customTiprackOptions = tiprackOptions.filter(option =>
    option.value.includes('custom_beta')
  )

  const nameAccessor = `pipettesByMount.${mount}.tiprackDefURI`
  const currentValue = values.pipettesByMount[mount].tiprackDefURI

  React.useEffect(() => {
    if (currentValue === undefined) {
      setFieldValue(nameAccessor, tiprackOptions[0]?.value ?? '')
    }
  }, [currentValue, setFieldValue, nameAccessor, tiprackOptions])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      overflowY="scroll"
      gridGap={SPACING.spacing8}
    >
      <Flex flexWrap="wrap" gridGap={SPACING.spacing4} alignSelf={ALIGN_CENTER}>
        {defaultTiprackOptions.map(o => (
          <EquipmentOption
            key={o.name}
            isSelected={currentValue === o.value}
            text={o.name}
            onClick={() => {
              setFieldValue(nameAccessor, o.value)
            }}
            width="21.75rem"
            minHeight="4rem"
          />
        ))}
      </Flex>
      <Flex justifyContent={JUSTIFY_END} alignItems={ALIGN_CENTER}>
        <Btn
          aria-label="PipetteTipsTile_customTipButton"
          onClick={() => setShowCustomTipracks(!showCustomTipracks)}
        >
          <Icon
            css={ACCORDION_STYLE}
            size="1.5rem"
            name={showCustomTipracks ? 'minus' : 'plus'}
          />
        </Btn>
      </Flex>
      {showCustomTipracks ? (
        <>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Text as="h4">
              {i18n.t('modal.create_file_wizard.custom_tiprack')}
            </Text>

            <OutlineButton Component="label" css={INPUT_STYLE}>
              <Flex
                flexDirection={DIRECTION_ROW}
                alignItems={ALIGN_CENTER}
                gridGap={SPACING.spacing2}
              >
                <Icon name="plus" size="1rem" />
                {i18n.t('modal.create_file_wizard.upload')}
              </Flex>
              <input
                type="file"
                onChange={e => dispatch(createCustomTiprackDef(e))}
              />
            </OutlineButton>
          </Flex>
          {customTiprackOptions.length > 0 ? (
            <Flex
              flexWrap={WRAP}
              gridGap={SPACING.spacing4}
              alignSelf={
                customTiprackOptions.length > 1 ? ALIGN_CENTER : ALIGN_START
              }
            >
              {customTiprackOptions.map(o => (
                <EquipmentOption
                  key={o.name}
                  isSelected={currentValue === o.value}
                  text={o.name}
                  onClick={() => {
                    setFieldValue(nameAccessor, o.value)
                  }}
                  width="21.75rem"
                  minHeight="4rem"
                />
              ))}
            </Flex>
          ) : (
            <Flex
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
              width="100%"
              height="8.5rem"
              backgroundColor={COLORS.darkBlack20}
              padding={SPACING.spacing8}
              border={BORDERS.lineBorder}
              borderRadius={BORDERS.borderRadiusSize2}
            >
              <Text
                as="h4"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
                color={COLORS.darkBlack70}
              >
                {i18n.t('modal.create_file_wizard.upload_tiprack')}
              </Text>
            </Flex>
          )}
        </>
      ) : null}
    </Flex>
  )
}
