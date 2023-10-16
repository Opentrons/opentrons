import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LocationIcon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getFixtureDisplayName,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'
// import { parseInitialLoadedFixturesByCutout } from '@opentrons/api-client'
import {
  CONFIGURED,
  CONFLICTING,
  NOT_CONFIGURED,
  useLoadedFixturesConfigStatus,
} from '../../resources/deck_configuration/hooks'
import { LocationConflictModal } from '../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'
import { StyledText } from '../../atoms/text'
import { Chip } from '../../atoms/Chip'
import { useFeatureFlag } from '../../redux/config'

import type {
  CompletedProtocolAnalysis,
  LoadFixtureRunTimeCommand,
} from '@opentrons/shared-data'

interface FixtureTableProps {
  mostRecentAnalysis: CompletedProtocolAnalysis | null
}

export function FixtureTable({
  mostRecentAnalysis,
}: FixtureTableProps): JSX.Element {
  const { t, i18n } = useTranslation('protocol_setup')
  const enableDeckConfig = useFeatureFlag('enableDeckConfiguration')
  const STUBBED_LOAD_FIXTURE: LoadFixtureRunTimeCommand = {
    id: 'stubbed_load_fixture',
    commandType: 'loadFixture',
    params: {
      fixtureId: 'stubbedFixtureId',
      loadName: WASTE_CHUTE_LOAD_NAME,
      location: { cutout: 'D3' },
    },
    createdAt: 'fakeTimestamp',
    startedAt: 'fakeTimestamp',
    completedAt: 'fakeTimestamp',
    status: 'succeeded',
  }

  const [
    showLocationConflictModal,
    setShowLocationConflictModal,
  ] = React.useState<boolean>(false)

  const requiredFixtureDetails =
    enableDeckConfig && mostRecentAnalysis?.commands != null
      ? [
          // parseInitialLoadedFixturesByCutout(mostRecentAnalysis.commands),
          STUBBED_LOAD_FIXTURE,
        ]
      : []

  const configurations = useLoadedFixturesConfigStatus(requiredFixtureDetails)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      <Flex
        color={COLORS.darkBlack70}
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        gridGap={SPACING.spacing24}
        lineHeight={TYPOGRAPHY.lineHeight28}
        paddingX={SPACING.spacing24}
      >
        <StyledText flex="4 0 0">{t('fixture')}</StyledText>
        <StyledText flex="2 0 0">{t('location')}</StyledText>
        <StyledText flex="3 0 0"> {t('status')}</StyledText>
      </Flex>
      {requiredFixtureDetails.map((fixture, index) => {
        const configurationStatus = configurations.find(
          configuration => configuration.id === fixture.id
        )?.configurationStatus

        const statusNotReady =
          configurationStatus === CONFLICTING ||
          configurationStatus === NOT_CONFIGURED

        let chipLabel: JSX.Element
        let handleClick
        if (statusNotReady) {
          chipLabel = (
            <>
              <Chip
                text={
                  configurationStatus === CONFLICTING
                    ? i18n.format(t('location_conflict'), 'capitalize')
                    : i18n.format(t('not_configured'), 'capitalize')
                }
                type="warning"
                background={false}
                iconName="connection-status"
              />
              <Icon name="more" size="3rem" />
            </>
          )
          handleClick = () => setShowLocationConflictModal(true)
        } else if (configurationStatus === CONFIGURED) {
          chipLabel = (
            <Chip
              text={i18n.format(t('configured'), 'capitalize')}
              type="success"
              background={false}
              iconName="connection-status"
            />
          )

          //  shouldn't run into this case
        } else {
          chipLabel = <div>status label unknown</div>
        }

        return (
          <>
            {showLocationConflictModal ? (
              <LocationConflictModal
                onCloseClick={() => setShowLocationConflictModal(false)}
                cutout={fixture.params.location.cutout}
                requiredFixture={fixture.params.loadName}
                isOnDevice={true}
              />
            ) : null}
            <Flex
              flexDirection={DIRECTION_ROW}
              key={fixture.params.fixtureId}
              alignItems={ALIGN_CENTER}
              backgroundColor={statusNotReady ? COLORS.yellow3 : COLORS.green3}
              borderRadius={BORDERS.borderRadiusSize3}
              gridGap={SPACING.spacing24}
              padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
              onClick={handleClick}
              marginBottom={
                index === requiredFixtureDetails.length - 1
                  ? SPACING.spacing68
                  : 'none'
              }
            >
              <Flex flex="4 0 0" alignItems={ALIGN_CENTER}>
                <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {getFixtureDisplayName(fixture.params.loadName)}
                </StyledText>
              </Flex>
              <Flex flex="2 0 0" alignItems={ALIGN_CENTER}>
                <LocationIcon slotName={fixture.params.location.cutout} />
              </Flex>
              <Flex
                flex="3 0 0"
                alignItems={ALIGN_CENTER}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
              >
                {chipLabel}
              </Flex>
            </Flex>
          </>
        )
      })}
    </Flex>
  )
}
