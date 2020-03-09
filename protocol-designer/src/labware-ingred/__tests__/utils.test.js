import { getNextNickname } from '../utils'

describe('getNextNickname', () => {
  const testCases = [
    {
      desc: 'first nickname adds no disambig number',
      allNicknames: [],
      proposed: 'test',
      expected: 'test',
    },
    {
      desc: 'ignores non-matching nicknames',
      allNicknames: ['otherThing'],
      proposed: 'coolNew',
      expected: 'coolNew',
    },
    {
      desc: 'adds (1) suffix on first match',
      allNicknames: ['cool'],
      proposed: 'cool',
      expected: 'cool (1)',
    },
    {
      desc: 'increments (1) suffix to (2) when duplicating',
      allNicknames: ['cool', 'cool(1)'],
      proposed: 'cool (1)',
      expected: 'cool (2)',
    },
    {
      desc: 'adds (2) suffix on second match',
      allNicknames: ['cool', 'cool (1)'],
      proposed: 'cool',
      expected: 'cool (2)',
    },
    {
      desc: "doesn't care about gaps, just uses highest number",
      allNicknames: ['cool', 'cool (6)'],
      proposed: 'cool',
      expected: 'cool (7)',
    },
    {
      desc: 'handles multiple digits',
      allNicknames: ['cool (11)'],
      proposed: 'cool',
      expected: 'cool (12)',
    },
    {
      desc: 'handles parentheses in name',
      allNicknames: ['cool (purified)'],
      proposed: 'cool (purified)',
      expected: 'cool (purified) (1)',
    },
    {
      desc: 'trims whitespace',
      allNicknames: ['  cool '],
      proposed: ' cool',
      expected: 'cool (1)',
    },
  ]

  testCases.forEach(({ desc, allNicknames, proposed, expected }) => {
    it(desc, () => {
      const result = getNextNickname(allNicknames, proposed)
      expect(result).toEqual(expected)
    })
  })
})
