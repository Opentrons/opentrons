// prompt for ReviewModulesModal of labware calibration page
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'
import { push } from 'connected-react-router'

import {
  useHoverTooltip,
  Flex,
  LightSecondaryBtn,
  Link,
  Text,
  Tooltip,
  ALIGN_CENTER,
  C_BLUE,
  C_WHITE,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_2,
  FONT_SIZE_HEADER,
  FONT_WEIGHT_SEMIBOLD,
  SIZE_3,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import { selectors as robotSelectors } from '../../../redux/robot'

import type { Dispatch } from '../../../redux/types'

const SUPPORT_PAGE =
  'https://support.opentrons.com/en/articles/5167312-using-modules-of-the-same-type-on-the-ot-2'

export interface PromptProps {
  modulesMissing: boolean
  onPromptClick: () => unknown
  hasDuplicateModules: boolean
}

export function Prompt(props: PromptProps): JSX.Element {
  const { modulesMissing, onPromptClick, hasDuplicateModules } = props
  const { t } = useTranslation('protocol_calibration')
  const [targetProps, tooltipProps] = useHoverTooltip()

  const dispatch = useDispatch<Dispatch>()

  const nextUnconfirmedLabware = useSelector(
    robotSelectors.getUnconfirmedLabware
  )
  const nextLabware = useSelector(robotSelectors.getNotTipracks)
  const slot = nextUnconfirmedLabware?.[0]?.slot || nextLabware?.[0]?.slot
  const continueButtonOnClick = `/calibrate/labware/${slot}`
  return (
    <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
      <Text
        textAlign={TEXT_ALIGN_CENTER}
        fontSize={FONT_SIZE_HEADER}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        color={C_WHITE}
        marginX={SPACING_3}
      >
        {t('module_connect_description')}
      </Text>
      {hasDuplicateModules && (
        <Text
          paddingX={SPACING_4}
          marginY={SPACING_2}
          fontSize={FONT_SIZE_BODY_2}
          textAlign={TEXT_ALIGN_CENTER}
          color={C_WHITE}
        >
          <Trans
            t={t}
            i18nKey="module_connect_duplicate_description"
            components={{
              a: <Link color={C_BLUE} external href={SUPPORT_PAGE} />,
            }}
          />
        </Text>
      )}
      <Flex {...targetProps}>
        <LightSecondaryBtn
          marginY={SPACING_2}
          paddingX={SIZE_3}
          onClick={() => {
            onPromptClick()
            dispatch(push(continueButtonOnClick))
          }}
          disabled={modulesMissing}
        >
          {t('module_connect_proceed_button')}
        </LightSecondaryBtn>
        {modulesMissing && (
          <Tooltip {...tooltipProps}>
            {t('module_connect_missing_tooltip')}
          </Tooltip>
        )}
      </Flex>
    </Flex>
  )
}
