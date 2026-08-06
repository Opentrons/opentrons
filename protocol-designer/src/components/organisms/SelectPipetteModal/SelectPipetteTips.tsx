import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_STRETCH,
  Btn,
  Checkbox,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  DISPLAY_INLINE_BLOCK,
  Flex,
  PRODUCT,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { createCustomTiprackDef } from '/protocol-designer/labware-defs/actions'
import { removeOpentronsPhrases } from '/protocol-designer/utils'

import { useKitchen } from '../Kitchen/useKitchen'

import type { ThunkDispatch } from 'redux-thunk'
import type { Dispatch, SetStateAction } from 'react'
import type { RobotType } from '@opentrons/shared-data'
import type { BaseState } from '/protocol-designer/types'

interface SelectPipetteTipsProps {
  robotType: RobotType
  tiprackOptions: Record<string, string>
  selectedValues: string[]
  pipetteVolume: string | null
  setIncompatibleTip: Dispatch<SetStateAction<boolean>>
  setSelectedTipracks: Dispatch<SetStateAction<string[]>>
  setAllowAllTipracks: Dispatch<SetStateAction<boolean>>
  allowAllTipracks: boolean
}

const MAX_TIPRACKS_ALLOWED = 3

export function SelectPipetteTips(props: SelectPipetteTipsProps): JSX.Element {
  const {
    robotType,
    tiprackOptions,
    selectedValues,
    pipetteVolume,
    setIncompatibleTip,
    setSelectedTipracks,
    setAllowAllTipracks,
    allowAllTipracks,
  } = props
  const { t } = useTranslation('onboarding')
  const { makeSnackbar } = useKitchen()
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()

  const handleSelectTips = (value: string): void => {
    const isCurrentlySelected = selectedValues.includes(value)

    if (isCurrentlySelected) {
      setSelectedTipracks(selectedValues.filter(v => v !== value))
    } else {
      if (selectedValues.length === MAX_TIPRACKS_ALLOWED) {
        makeSnackbar(t('up_to_3_tipracks') as string)
      } else {
        setSelectedTipracks([...selectedValues, value])
      }
    }
  }

  const handleAllowAllTips = (): void => {
    if (allowAllTipracks) {
      setAllowAllTipracks(prev => !prev)
    } else {
      setIncompatibleTip(true)
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <StyledText desktopStyle="headingSmallBold">
          {t('pipette_tips')}
        </StyledText>
        <StyledBox>
          {Object.entries(tiprackOptions).map(([value, name]) => (
            <Checkbox
              key={value}
              isChecked={selectedValues.includes(value)}
              labelText={removeOpentronsPhrases(name)}
              onChange={() => {
                handleSelectTips(value)
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
              type="file"
              onChange={e => dispatch(createCustomTiprackDef(e))}
            />
          </StyledLabel>
          {pipetteVolume === 'p1000' && robotType === FLEX_ROBOT_TYPE ? null : (
            <Btn
              onClick={() => {
                handleAllowAllTips()
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
        </StyledBox>
      </Flex>
    </Flex>
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

const StyledBox = styled.div`
  gap: ${SPACING.spacing4};
  display: ${DISPLAY_FLEX};
  flex-wrap: ${WRAP};
  align-items: ${ALIGN_CENTER};
  align-content: ${ALIGN_CENTER};
  align-self: ${ALIGN_STRETCH};
`
