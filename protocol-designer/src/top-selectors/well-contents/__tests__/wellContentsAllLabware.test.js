import wellContentsAllLabware from '../wellContentsAllLabware'

// FIXTURES
const baseIngredFields = {
  groupId: '0',
  name: 'Some Ingred',
  description: null,
  individualize: false,
}

const containerState = {
  'FIXED_TRASH_ID': {
    type: 'trash-box',
    name: 'Trash',
    slot: '12',
  },
  container1Id: {
    slot: '10',
    type: '96-flat',
    name: 'Labware 1',
  },
  container2Id: {
    slot: '8',
    type: '96-deep-well',
    name: 'Labware 2',
  },
  container3Id: {
    slot: '9',
    type: 'tube-rack-2ml',
    name: 'Labware 3',
  },
}

const ingredsByLabwareXXSingleIngred = {
  'container1Id': {
    '0': {
      ...baseIngredFields,
      wells: {
        A1: {volume: 100},
        B1: {volume: 150},
      },
    },
  },
  'container2Id': {},
  'container3Id': {},
  'FIXED_TRASH_ID': {},
}

const defaultWellContents = {
  highlighted: false,
  selected: false,
}

const container1MaxVolume = 400

describe('wellContentsAllLabware', () => {
  const singleIngredResult = wellContentsAllLabware.resultFunc(
    containerState, // all labware
    ingredsByLabwareXXSingleIngred,
    {id: 'container1Id'}, // selected labware
    {A1: 'A1', B1: 'B1'}, // selected
    {A3: 'A3'} // highlighted
  )

  // TODO: 2nd test case
  // const twoIngredResult = selectors.wellContentsAllLabware.resultFunc(
  //   containerState, // all labware
  //   ingredsByLabwareXXTwoIngred,
  //   containerState.container2Id, // selected labware
  //   {A1: 'A1', B1: 'B1'}, // selected
  //   {A3: 'A3'} // highlighted
  // )

  test('container has expected number of wells', () => {
    expect(Object.keys(singleIngredResult.container1Id).length).toEqual(96)
  })

  test('selects well contents of all labware (for Plate props)', () => {
    expect(
      singleIngredResult
    ).toMatchObject({
      'FIXED_TRASH_ID': {
        A1: defaultWellContents,
      },
      container2Id: {
        A1: defaultWellContents,
      },
      container3Id: {
        A1: defaultWellContents,
      },

      container1Id: {
        A1: {
          ...defaultWellContents,
          selected: true,
          maxVolume: container1MaxVolume,
        },
        A2: {
          ...defaultWellContents,
          maxVolume: container1MaxVolume,
        },
        B1: {
          ...defaultWellContents,
          selected: true,
          maxVolume: container1MaxVolume,
        },
        B2: {
          ...defaultWellContents,
          maxVolume: container1MaxVolume,
        },
      },
    })
  })
})
