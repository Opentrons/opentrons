// TODO(bh, 2023-09-26): refine types and move to shared data when settled
export type FixtureName = 'extensionSlot' | 'standardSlot' | 'wasteChute'
export type FixtureLocation = 'B3' | 'C3' | 'D3'

export interface Fixture {
  fixtureId: string
  fixtureLocation: FixtureLocation
  loadName: FixtureName
}

export type DeckConfiguration = Fixture[]
