import * as React from 'react'
import map from 'lodash/map'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  BORDERS,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { FixtureLoadName, getFixtureDisplayName } from '@opentrons/shared-data'
import { StyledText } from '../../../../atoms/text'
import { StatusLabel } from '../../../../atoms/StatusLabel'
import { getFixtureImage } from './utils'

import type { LoadedFixturesBySlot } from '@opentrons/api-client'

interface SetupModulesListProps {
  loadedFixturesBySlot: LoadedFixturesBySlot
}

export const SetupFixtureList = (props: SetupModulesListProps): JSX.Element => {
  const { loadedFixturesBySlot } = props
  const { t, i18n } = useTranslation('protocol_setup')
  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginTop={SPACING.spacing16}
        marginLeft={SPACING.spacing20}
        marginBottom={SPACING.spacing4}
      >
        <StyledText
          css={TYPOGRAPHY.labelSemiBold}
          marginBottom={SPACING.spacing8}
          width="45%"
        >
          {i18n.format(t('fixture_name'), 'capitalize')}
        </StyledText>
        <StyledText
          css={TYPOGRAPHY.labelSemiBold}
          marginRight={SPACING.spacing16}
          width="15%"
        >
          {t('location')}
        </StyledText>
        <StyledText
          css={TYPOGRAPHY.labelSemiBold}
          marginRight={SPACING.spacing16}
          width="15%"
        >
          {t('status')}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        width="100%"
        overflowY="auto"
        gridGap={SPACING.spacing4}
        marginBottom={SPACING.spacing24}
      >
        {map(loadedFixturesBySlot, ({ params }) => {
          const { loadName, location } = params
          return (
            <FixtureListItem
              key={`SetupFixturesList_${loadName}_slot_${location.cutout}`}
              loadName={loadName}
              cutout={location.cutout}
            />
          )
        })}
      </Flex>
    </>
  )
}

interface FixtureListItemProps {
  loadName: FixtureLoadName
  cutout: string
}

export function FixtureListItem({
  loadName,
  cutout,
}: FixtureListItemProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  const statusLabel = (
    <StatusLabel
      status="Configured"
      backgroundColor={COLORS.successBackgroundLight}
      iconColor={COLORS.successEnabled}
      textColor={COLORS.successText}
    />
  )
  // TODO(jr, 10/4/23): wire up other status labels

  return (
    <>
      <Box
        border={BORDERS.styleSolid}
        borderColor={COLORS.medGreyEnabled}
        borderWidth="1px"
        borderRadius={BORDERS.radiusSoftCorners}
        padding={SPACING.spacing16}
        backgroundColor={COLORS.white}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={JUSTIFY_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex alignItems={JUSTIFY_CENTER} width="45%">
            <img width="60px" height="54px" src={getFixtureImage(loadName)} />
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText
                css={TYPOGRAPHY.pSemiBold}
                marginLeft={SPACING.spacing20}
              >
                {getFixtureDisplayName(loadName)}
              </StyledText>
              <Btn
                marginLeft={SPACING.spacing16}
                css={css`
                  color: ${COLORS.blueEnabled};

                  &:hover {
                    color: ${COLORS.blueHover};
                  }
                `}
                marginTop={SPACING.spacing4}
                //  TODO(jr, 10/4/23): wire up the instructions modal
                onClick={() => console.log('wire this up')}
              >
                <StyledText marginLeft={SPACING.spacing4} as="p">
                  {t('view_setup_instructions')}
                </StyledText>
              </Btn>
            </Flex>
          </Flex>
          <StyledText as="p" width="15%">
            {cutout}
          </StyledText>
          <Flex width="15%">{statusLabel}</Flex>
        </Flex>
      </Box>
    </>
  )
}
