import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DeckConfigurator,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SIZE_5,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  getFixtureDisplayName,
  STANDARD_SLOT_LOAD_NAME,
} from '@opentrons/shared-data'

import { StyledText } from '../../atoms/text'
import { DeckFixtureSetupInstructionsModal } from './DeckFixtureSetupInstructionsModal'
import { AddDeckConfigurationModal } from './AddDeckConfigurationModal'

interface DeviceDetailsDeckConfigurationProps {
  robotName: string
}

export function DeviceDetailsDeckConfiguration({
  robotName,
}: DeviceDetailsDeckConfigurationProps): JSX.Element | null {
  const { t } = useTranslation('device_details')
  const [
    showSetupInstructionsModal,
    setShowSetupInstructionsModal,
  ] = React.useState<boolean>(false)
  const [showAddFixtureModal, setShowAddFixtureModal] = React.useState<boolean>(
    false
  )
  const [
    targetFixtureLocation,
    setTargetFixtureLocation,
  ] = React.useState<string>('')

  const deckConfig = useDeckConfigurationQuery().data ?? []
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()

  const handleClickAdd = (fixtureLocation: string): void => {
    setTargetFixtureLocation(fixtureLocation)
    setShowAddFixtureModal(true)
  }

  const handleClickRemove = (fixtureLocation: string): void => {
    updateDeckConfiguration({
      fixtureLocation,
      loadName: STANDARD_SLOT_LOAD_NAME,
    })
  }

  // do not show standard slot in fixture display list
  const fixtureDisplayList = deckConfig.filter(
    fixture => fixture.loadName !== STANDARD_SLOT_LOAD_NAME
  )

  return (
    <>
      {showAddFixtureModal ? (
        <AddDeckConfigurationModal
          fixtureLocation={targetFixtureLocation}
          setShowAddFixtureModal={setShowAddFixtureModal}
        />
      ) : null}
      {showSetupInstructionsModal ? (
        <DeckFixtureSetupInstructionsModal
          setShowSetupInstructionsModal={setShowSetupInstructionsModal}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_FLEX_START}
        backgroundColor={COLORS.white}
        border={BORDERS.lineBorder}
        borderRadius={BORDERS.radiusSoftCorners}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        width="100%"
        marginBottom={SPACING.spacing16}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing16}
          width="100%"
          borderBottom={BORDERS.lineBorder}
        >
          <StyledText
            as="h3"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            id="DeckConfiguration_title"
          >
            {`${robotName} ${t('deck_configuration')}`}
          </StyledText>
          <Link
            role="button"
            css={TYPOGRAPHY.linkPSemiBold}
            onClick={() => setShowSetupInstructionsModal(true)}
          >
            {t('setup_instructions')}
          </Link>
        </Flex>

        <Flex
          gridGap={SPACING.spacing40}
          paddingX={SPACING.spacing16}
          paddingY={SPACING.spacing32}
          width="100%"
        >
          <Flex
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            marginLeft={`-${SPACING.spacing32}`}
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            marginTop={`-${SPACING.spacing60}`}
          >
            <DeckConfigurator
              deckConfig={deckConfig}
              handleClickAdd={handleClickAdd}
              handleClickRemove={handleClickRemove}
            />
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            width="32rem"
          >
            <Flex
              gridGap={SPACING.spacing32}
              paddingLeft={SPACING.spacing8}
              css={TYPOGRAPHY.labelSemiBold}
            >
              <StyledText>{t('location')}</StyledText>
              <StyledText>{t('fixture')}</StyledText>
            </Flex>
            {fixtureDisplayList.map(fixture => {
              return (
                <Flex
                  key={fixture.fixtureId}
                  backgroundColor={COLORS.fundamentalsBackground}
                  gridGap={SPACING.spacing60}
                  padding={SPACING.spacing8}
                  width={SIZE_5}
                  css={TYPOGRAPHY.labelRegular}
                >
                  <StyledText>{fixture.fixtureLocation}</StyledText>
                  <StyledText>
                    {getFixtureDisplayName(fixture.loadName)}
                  </StyledText>
                </Flex>
              )
            })}
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
