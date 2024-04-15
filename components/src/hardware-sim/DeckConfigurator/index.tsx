import * as React from 'react'

import {
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  TEMPERATURE_MODULE_V2_FIXTURE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
} from '@opentrons/shared-data'

import { COLORS } from '../../helix-design-system'
import { SingleSlotFixture } from '../BaseDeck/SingleSlotFixture'
import { SlotLabels } from '../Deck'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { EmptyConfigFixture } from './EmptyConfigFixture'
import { StagingAreaConfigFixture } from './StagingAreaConfigFixture'
import { TrashBinConfigFixture } from './TrashBinConfigFixture'
import { WasteChuteConfigFixture } from './WasteChuteConfigFixture'
import { StaticFixture } from './StaticFixture'

import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import { TemperatureModuleFixture } from './TemperatureModuleFixture'
import { HeaterShakerFixture } from './HeaterShakerFixture'
import { MagneticBlockFixture } from './MagneticBlockFixture'
import { ThermocyclerFixture } from './ThermocyclerFixture'

interface DeckConfiguratorProps {
  deckConfig: DeckConfiguration
  handleClickAdd: (cutoutId: CutoutId) => void
  handleClickRemove: (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ) => void
  lightFill?: string
  darkFill?: string
  readOnly?: boolean
  showExpansion?: boolean
  children?: React.ReactNode
  additionalStaticFixtures?: Array<{ location: CutoutId; label: string }>
}

export function DeckConfigurator(props: DeckConfiguratorProps): JSX.Element {
  const {
    deckConfig,
    handleClickAdd,
    handleClickRemove,
    lightFill = COLORS.grey35,
    darkFill = COLORS.black90,
    readOnly = false,
    showExpansion = true,
    additionalStaticFixtures,
    children,
  } = props
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  // restrict configuration to certain locations
  const configurableFixtureLocations: CutoutId[] = [
    'cutoutA1',
    'cutoutB1',
    'cutoutC1',
    'cutoutD1',
    'cutoutA2',
    'cutoutB2',
    'cutoutC2',
    'cutoutD2',
    'cutoutA3',
    'cutoutB3',
    'cutoutC3',
    'cutoutD3',
  ]
  const configurableDeckConfig = deckConfig.filter(({ cutoutId }) =>
    configurableFixtureLocations.includes(cutoutId)
  )

  const stagingAreaFixtures = configurableDeckConfig.filter(
    ({ cutoutFixtureId }) => cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE
  )
  const wasteChuteFixtures = configurableDeckConfig.filter(
    ({ cutoutFixtureId }) =>
      cutoutFixtureId != null &&
      WASTE_CHUTE_ONLY_FIXTURES.includes(cutoutFixtureId)
  )
  const wasteChuteStagingAreaFixtures = configurableDeckConfig.filter(
    ({ cutoutFixtureId }) =>
      cutoutFixtureId != null &&
      WASTE_CHUTE_STAGING_AREA_FIXTURES.includes(cutoutFixtureId)
  )
  const emptyFixtures = readOnly
    ? []
    : configurableDeckConfig.filter(
        ({ cutoutFixtureId }) =>
          cutoutFixtureId != null &&
          SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
      )
  const trashBinFixtures = configurableDeckConfig.filter(
    ({ cutoutFixtureId }) => cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
  )
  const thermocyclerFixtures = configurableDeckConfig.filter(
    ({ cutoutFixtureId }) => cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE
  )
  const heaterShakerFixtures = configurableDeckConfig.filter(
    ({ cutoutFixtureId }) => cutoutFixtureId === HEATERSHAKER_MODULE_V1_FIXTURE
  )
  const temperatureModuleFixtures = configurableDeckConfig.filter(
    ({ cutoutFixtureId }) => cutoutFixtureId === TEMPERATURE_MODULE_V2_FIXTURE
  )
  const magneticBlockFixtures = configurableDeckConfig.filter(
    ({ cutoutFixtureId }) =>
      ([
        MAGNETIC_BLOCK_V1_FIXTURE,
        STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
      ] as CutoutFixtureId[]).includes(cutoutFixtureId)
  )

  return (
    <RobotCoordinateSpace
      height="455px"
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {deckDef.locations.cutouts.map(cutout => (
        // give the outside of the base fixture svgs a stroke for extra spacing
        <g key={cutout.id} stroke={COLORS.white} strokeWidth="4">
          <SingleSlotFixture
            cutoutId={cutout.id}
            deckDefinition={deckDef}
            slotClipColor={COLORS.transparent}
            fixtureBaseColor={lightFill}
            showExpansion={showExpansion}
          />
        </g>
      ))}
      {stagingAreaFixtures.map(({ cutoutId, cutoutFixtureId }) => (
        <StagingAreaConfigFixture
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
        />
      ))}
      {emptyFixtures.map(({ cutoutId }) => (
        <EmptyConfigFixture
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickAdd={handleClickAdd}
          fixtureLocation={cutoutId}
        />
      ))}
      {wasteChuteFixtures.map(({ cutoutId, cutoutFixtureId }) => (
        <WasteChuteConfigFixture
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
        />
      ))}
      {wasteChuteStagingAreaFixtures.map(({ cutoutId, cutoutFixtureId }) => (
        <WasteChuteConfigFixture
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          hasStagingAreas
        />
      ))}
      {trashBinFixtures.map(({ cutoutId, cutoutFixtureId }) => (
        <TrashBinConfigFixture
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
        />
      ))}
      {temperatureModuleFixtures.map(({ cutoutId, cutoutFixtureId }) => (
        <TemperatureModuleFixture
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
        />
      ))}
      {heaterShakerFixtures.map(({ cutoutId, cutoutFixtureId }) => (
        <HeaterShakerFixture
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
        />
      ))}
      {magneticBlockFixtures.map(({ cutoutId, cutoutFixtureId }) => (
        <MagneticBlockFixture
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
          hasStagingArea={
            cutoutFixtureId === STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
          }
        />
      ))}
      {thermocyclerFixtures.map(({ cutoutId, cutoutFixtureId }) => (
        <ThermocyclerFixture
          key={cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={cutoutId}
          cutoutFixtureId={cutoutFixtureId}
        />
      ))}
      {additionalStaticFixtures?.map(staticFixture => (
        <StaticFixture
          key={staticFixture.location}
          deckDefinition={deckDef}
          label={staticFixture.label}
          fixtureLocation={staticFixture.location}
        />
      ))}
      <SlotLabels
        robotType={FLEX_ROBOT_TYPE}
        color={darkFill}
        show4thColumn={
          stagingAreaFixtures.length > 0 ||
          wasteChuteStagingAreaFixtures.length > 0
        }
      />
      {children}
    </RobotCoordinateSpace>
  )
}
