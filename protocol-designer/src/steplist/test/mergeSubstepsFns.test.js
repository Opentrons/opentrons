// @flow
import {
  mergeSubstepRowsSingleChannel,
  mergeSubstepRowsMultiChannel,
} from '../generateSubstepItem'

const ingred1Id = 'ingred1Id'
const wellNamesForCol = (isMulti: boolean, colNum: string): Array<string> =>
  isMulti ? 'ABCDEFGH'.split('').map(s => `${s}${colNum}`) : [`A${colNum}`]

type Ingreds = { [ingredId: string]: number }
const repeatIngreds = (
  isMulti: boolean,
  colNum: string,
  _ingreds: ?Ingreds
): Ingreds | Array<Ingreds> => {
  const ingreds = _ingreds || {}
  return isMulti
    ? wellNamesForCol(true, colNum).reduce(
        (acc, wellName) => ({ ...acc, [wellName]: ingreds }),
        {}
      )
    : ingreds
}

const getFixtures = ({ isMulti }: {| isMulti: boolean |}) => {
  const makeIngreds = (volume: number | null, colNum: string) =>
    repeatIngreds(isMulti, colNum, volume ? { [ingred1Id]: volume } : null)
  // NOTE: these cases do not cover dynamic behavior of `activeTips` key
  const activeTips = { labware: 'someTiprackId', well: 'A6' }
  return {
    activeTips,
    transferRowsFixture: [
      // from 'aspirate' command
      {
        activeTips,
        source: {
          wells: wellNamesForCol(isMulti, '1'),
          preIngreds: makeIngreds(30, '1'),
          postIngreds: makeIngreds(20, '1'),
        },
        volume: 10,
      },
      // from 'dispense' command
      {
        activeTips,
        dest: {
          wells: wellNamesForCol(isMulti, '12'),
          preIngreds: makeIngreds(null, '12'),
          postIngreds: makeIngreds(10, '12'),
        },
        volume: 10,
      },
    ],
    consolidateRowsFixture: [
      // from 'aspirate' command
      {
        activeTips,
        source: {
          wells: ['A1'],
          preIngreds: makeIngreds(30, '1'),
          postIngreds: makeIngreds(25, '1'),
        },
        volume: 5,
      },
      // second 'aspirate'
      {
        activeTips,
        source: {
          wells: wellNamesForCol(isMulti, '2'),
          preIngreds: makeIngreds(36, '2'),
          postIngreds: makeIngreds(31, '2'),
        },
        volume: 5,
      },
      // from 'dispense' command
      {
        activeTips,
        dest: {
          wells: wellNamesForCol(isMulti, '12'),
          preIngreds: makeIngreds(null, '12'),
          postIngreds: makeIngreds(10, '12'),
        },
        volume: 10,
      },
    ],
    distributeRowsFixture: [
      // from 'aspirate' command
      {
        activeTips,
        source: {
          wells: wellNamesForCol(isMulti, '1'),
          preIngreds: makeIngreds(30, '1'),
          postIngreds: makeIngreds(20, '1'),
        },
        volume: 10,
      },
      // first 'dispense'
      {
        activeTips,
        dest: {
          wells: wellNamesForCol(isMulti, '11'),
          preIngreds: makeIngreds(null, '11'),
          postIngreds: makeIngreds(5, '11'),
        },
        volume: 5,
      },
      // second 'dispense'
      {
        activeTips,
        dest: {
          wells: wellNamesForCol(isMulti, '12'),
          preIngreds: makeIngreds(null, '12'),
          postIngreds: makeIngreds(5, '12'),
        },
        volume: 5,
      },
    ],
  }
}

describe('mergeSubstepRowsSingleChannel', () => {
  const {
    activeTips,
    transferRowsFixture,
    consolidateRowsFixture,
    distributeRowsFixture,
  } = getFixtures({ isMulti: false })

  const testCases = [
    {
      testName: 'mock transfer / mix',
      showDispenseVol: false,
      substepRows: transferRowsFixture,
      expected: [
        // merged into single row
        {
          activeTips,
          source: {
            well: 'A1',
            preIngreds: { [ingred1Id]: 30 },
            postIngreds: { [ingred1Id]: 20 },
          },
          dest: {
            well: 'A12',
            preIngreds: {},
            postIngreds: { [ingred1Id]: 10 },
          },
          volume: 10,
        },
      ],
    },
    {
      testName: 'mock consolidate',
      showDispenseVol: false,
      substepRows: consolidateRowsFixture,
      expected: [
        // first aspirate stands alone
        {
          activeTips,
          source: {
            well: 'A1',
            preIngreds: { [ingred1Id]: 30 },
            postIngreds: { [ingred1Id]: 25 },
          },
          volume: 5,
        },
        // last asp + disp merged into single row
        {
          activeTips,
          source: {
            well: 'A2',
            preIngreds: { [ingred1Id]: 36 },
            postIngreds: { [ingred1Id]: 31 },
          },
          dest: {
            well: 'A12',
            preIngreds: {},
            postIngreds: { [ingred1Id]: 10 },
          },
          volume: 5,
        },
      ],
    },
    {
      testName: 'mock distribute',
      showDispenseVol: true, // IRL, this is only true for distribute
      substepRows: distributeRowsFixture,
      expected: [
        // first aspirate + disp merged into single row
        {
          activeTips,
          source: {
            well: 'A1',
            preIngreds: { [ingred1Id]: 30 },
            postIngreds: { [ingred1Id]: 20 },
          },
          dest: {
            well: 'A11',
            preIngreds: {},
            postIngreds: { [ingred1Id]: 5 },
          },
          volume: 5,
        },
        // last asp stands alone
        {
          activeTips,
          dest: {
            well: 'A12',
            preIngreds: {},
            postIngreds: { [ingred1Id]: 5 },
          },
          volume: 5,
        },
      ],
    },
  ]
  testCases.forEach(({ testName, showDispenseVol, substepRows, expected }) =>
    it(testName, () => {
      const result = mergeSubstepRowsSingleChannel({
        substepRows,
        showDispenseVol,
      })
      expect(result).toEqual(expected)
    })
  )
})

describe('mergeSubstepRowsMultiChannel', () => {
  const {
    transferRowsFixture,
    consolidateRowsFixture,
    distributeRowsFixture,
  } = getFixtures({ isMulti: true })
  const testCases = [
    {
      testName: 'mock transfer',
      showDispenseVol: false,
      isMixStep: false,
      substepRows: transferRowsFixture,
    },
    {
      testName: 'mock mix',
      showDispenseVol: false,
      isMixStep: true,
      substepRows: transferRowsFixture,
    },
    {
      testName: 'mock consolidate',
      showDispenseVol: false,
      isMixStep: false,
      substepRows: consolidateRowsFixture,
    },
    {
      testName: 'mock distribute',
      showDispenseVol: true, // NOTE: IRL, should only be true for distribute
      isMixStep: false,
      substepRows: distributeRowsFixture,
    },
  ]
  testCases.forEach(({ testName, isMixStep, showDispenseVol, substepRows }) =>
    it(testName, () => {
      const channels = 8
      const result = mergeSubstepRowsMultiChannel({
        channels,
        showDispenseVol,
        isMixStep,
        substepRows,
      })
      expect(result).toMatchSnapshot()
    })
  )
})
