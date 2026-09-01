import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import noop from 'lodash/noop'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  RobotInfoLabel,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'

import { formatVolume } from './utils'

import type { ReactNode } from 'react'
import type { AdditionalEquipmentName } from '@opentrons/step-generation'
import type {
  SubstepIdentifier,
  SubstepWellData,
} from '/protocol-designer/steplist'

interface SubstepProps {
  trashName: AdditionalEquipmentName | null
  stepId: string
  substepIndex: number
  isNested: boolean
  volume?: number | string | null
  source?: SubstepWellData
  dest?: SubstepWellData
  selectSubstep?: (substepIdentifier: SubstepIdentifier) => void
  isSameLabware?: boolean
  aspirateVolume?: number
  dispenseVolume?: number
}

function SubstepComponent(props: SubstepProps): ReactNode {
  const {
    volume,
    stepId,
    substepIndex,
    source,
    dest,
    trashName,
    selectSubstep: propSelectSubstep,
    isSameLabware,
    aspirateVolume,
    dispenseVolume,
    isNested,
  } = props
  const { i18n, t } = useTranslation([
    'application',
    'protocol_steps',
    'shared',
  ])

  const selectSubstep = propSelectSubstep ?? noop

  const volumeTag = (
    <Tag
      text={`${formatVolume(volume)} ${t('units.microliter')}`}
      type="default"
    />
  )
  const aspirateTag =
    aspirateVolume != null ? (
      <Tag
        text={`${formatVolume(aspirateVolume)} ${t('units.microliter')}`}
        type="default"
      />
    ) : null
  const dispenseTag =
    dispenseVolume != null ? (
      <Tag
        text={`${formatVolume(dispenseVolume)} ${t('units.microliter')}`}
        type="default"
      />
    ) : null

  const isMix = source?.well === dest?.well && isSameLabware
  return (
    <Flex
      onMouseEnter={() => {
        selectSubstep({
          stepId,
          substepIndex,
        })
      }}
      onMouseLeave={() => {
        selectSubstep(null)
      }}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
    >
      {isMix ? (
        <ListItem type={isNested ? 'defaultOnColor' : 'default'}>
          <Flex
            gridGap={SPACING.spacing4}
            padding={SPACING.spacing12}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
            alignItems={ALIGN_CENTER}
          >
            <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('protocol_steps:mix')}
              </StyledText>
              {volumeTag}
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('protocol_steps:in')}
              </StyledText>
              <RobotInfoLabel
                deckLabel={i18n.format(
                  t('protocol_steps:well_name', {
                    wellName: source?.well ?? '',
                  }),
                  'upperCase'
                )}
              />
            </Flex>
          </Flex>
        </ListItem>
      ) : (
        <>
          {source != null ? (
            <ListItem type={isNested ? 'defaultOnColor' : 'default'}>
              <Flex
                gridGap={SPACING.spacing4}
                padding={SPACING.spacing12}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                width="100%"
                alignItems={ALIGN_CENTER}
              >
                <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('protocol_steps:aspirated')}
                  </StyledText>
                  {aspirateTag ?? volumeTag}
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('protocol_steps:from')}
                  </StyledText>
                  <RobotInfoLabel
                    deckLabel={i18n.format(
                      t('protocol_steps:well_name', {
                        wellName: source.well,
                      }),
                      'upperCase'
                    )}
                  />
                </Flex>
              </Flex>
            </ListItem>
          ) : null}
          {dest != null ? (
            <ListItem type={isNested ? 'defaultOnColor' : 'default'}>
              <Flex
                gridGap={SPACING.spacing4}
                padding={SPACING.spacing12}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                width="100%"
                alignItems={ALIGN_CENTER}
              >
                {dest != null || trashName != null ? (
                  <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
                    <StyledText desktopStyle="bodyDefaultRegular">
                      {t('protocol_steps:dispensed')}
                    </StyledText>
                    {dispenseTag ?? volumeTag}
                    <StyledText desktopStyle="bodyDefaultRegular">
                      {t('protocol_steps:into')}
                    </StyledText>

                    <RobotInfoLabel
                      deckLabel={i18n.format(
                        dest?.well != null
                          ? t('protocol_steps:well_name', {
                              wellName: dest.well,
                            })
                          : t(`shared:${trashName}`),
                        'upperCase'
                      )}
                    />
                  </Flex>
                ) : null}
              </Flex>
            </ListItem>
          ) : null}
        </>
      )}
    </Flex>
  )
}

export const Substep = memo(SubstepComponent)
