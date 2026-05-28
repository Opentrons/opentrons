/**
 * Regression tests for scripts/git-version.mjs calendar tag regexes.
 *
 * Run from repository root:
 *   node --test scripts/test_git_version.mjs
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  OT2_EXTERNAL_TAG_RE,
  OT2_EXTERNAL_VERSION_RE,
  OT2_INTERNAL_TAG_RE,
  OT2_INTERNAL_VERSION_RE,
  detailsFromTag,
  firstCalendarExternalTagFromList,
  firstCalendarInternalTagFromList,
  prefixForProject,
  tagFromDetails,
  versionForProject,
} from './git-version.mjs'

/** @param {RegExp} re @param {string[]} accept */
function assertMatches(re, accept) {
  for (const sample of accept) {
    assert.match(sample, re, `expected ${re} to match ${sample}`)
  }
}

/** @param {RegExp} re @param {string[]} reject */
function assertRejects(re, reject) {
  for (const sample of reject) {
    assert.equal(
      re.test(sample),
      false,
      `expected ${re} not to match ${sample}`
    )
  }
}

describe('calendar regex composition', () => {
  it('does not nest a second start anchor in tag patterns', () => {
    assert.doesNotMatch(OT2_INTERNAL_TAG_RE.source, /internal@\^/)
    assert.doesNotMatch(OT2_EXTERNAL_TAG_RE.source, /v\^/)
  })
})

describe('OT2_INTERNAL_TAG_RE', () => {
  it('accepts calendar internal release tags', () => {
    assertMatches(OT2_INTERNAL_TAG_RE, [
      'internal@26.5.2601',
      'internal@26.5.2602-alpha',
      'internal@26.5.2602-beta',
      'internal@26.5.2801',
      'internal@26.12.3112',
    ])
  })

  it('rejects legacy hyphen suffixes and non-calendar internal tags', () => {
    assertRejects(OT2_INTERNAL_TAG_RE, [
      'internal@26.5.22-1',
      'internal@v6',
      'internal@26.0.2601',
      'internal@26.13.2601',
      'internal@26.5.2601-alpha.0',
      'internal@26.5.2601-extra',
      'internal@',
      'v26.5.2601',
    ])
  })
})

describe('OT2_INTERNAL_VERSION_RE', () => {
  it('accepts version tails without the internal@ prefix', () => {
    assertMatches(OT2_INTERNAL_VERSION_RE, [
      '26.5.2601',
      '26.5.2601-alpha',
      '26.5.2801',
    ])
  })

  it('rejects version tails with legacy hyphen suffixes', () => {
    assertRejects(OT2_INTERNAL_VERSION_RE, ['26.5.22-1'])
  })

  it('still matches ambiguous legacy-looking YY.M.NN tails without hyphens', () => {
    assert.match('26.5.22', OT2_INTERNAL_VERSION_RE)
    assert.match('internal@26.5.22', OT2_INTERNAL_TAG_RE)
  })
})

describe('OT2_EXTERNAL_TAG_RE', () => {
  it('accepts calendar external release tags', () => {
    assertMatches(OT2_EXTERNAL_TAG_RE, [
      'v26.6.0',
      'v26.6.0-alpha.0',
      'v26.6.0-alpha.13',
      'v26.6.0-beta.1',
      'v26.6.9',
    ])
  })

  it('rejects tags outside YY.M.N calendar semver', () => {
    assertRejects(OT2_EXTERNAL_TAG_RE, [
      'v26.6.10',
      'v26.6.0-alpha',
      'v26.6.0-alpha.0-extra',
      'v26.13.0',
      'v8.9.9-alpha.13',
      'internal@26.6.0',
    ])
  })
})

describe('OT2_EXTERNAL_VERSION_RE', () => {
  it('accepts external version tails without the v prefix', () => {
    assertMatches(OT2_EXTERNAL_VERSION_RE, [
      '26.6.0',
      '26.6.0-alpha.0',
      '26.6.0-alpha.13',
    ])
  })

  it('rejects multi-digit monthly release counters', () => {
    assertRejects(OT2_EXTERNAL_VERSION_RE, ['26.6.10', '26.6.00'])
  })
})

describe('firstCalendarInternalTagFromList', () => {
  it('skips legacy tags and returns the first calendar tag', () => {
    const tagList = [
      'internal@26.5.22-1',
      'internal@26.5.2801',
      'internal@26.5.2701',
    ]
    assert.equal(
      firstCalendarInternalTagFromList(tagList),
      'internal@26.5.2801'
    )
  })

  it('returns null when no calendar internal tags exist', () => {
    assert.equal(
      firstCalendarInternalTagFromList(['internal@26.5.22-1', 'internal@v1']),
      null
    )
  })

  it('prefers the first regex match in tag-list order (DNN tags should sort first)', () => {
    assert.equal(
      firstCalendarInternalTagFromList([
        'internal@26.5.2801',
        'internal@26.5.22',
      ]),
      'internal@26.5.2801'
    )
    assert.equal(
      firstCalendarInternalTagFromList([
        'internal@26.5.22',
        'internal@26.5.2801',
      ]),
      'internal@26.5.22'
    )
  })
})

describe('firstCalendarExternalTagFromList', () => {
  it('skips non-calendar v tags and returns the first calendar tag', () => {
    const tagList = ['v8.9.9-alpha.13', 'v26.6.0', 'v26.5.9']
    assert.equal(firstCalendarExternalTagFromList(tagList), 'v26.6.0')
  })

  it('returns null when no calendar external tags exist', () => {
    assert.equal(
      firstCalendarExternalTagFromList(['v8.9.9', 'v8.9.9-alpha.13']),
      null
    )
  })
})

describe('detailsFromTag', () => {
  it('parses calendar internal and external tags', () => {
    assert.deepEqual(detailsFromTag('internal@26.5.2801'), [
      'robot-stack-internal',
      '26.5.2801',
    ])
    assert.deepEqual(detailsFromTag('internal@26.5.2601-alpha'), [
      'robot-stack-internal',
      '26.5.2601-alpha',
    ])
    assert.deepEqual(detailsFromTag('v26.6.0'), ['robot-stack', '26.6.0'])
    assert.deepEqual(detailsFromTag('v26.6.0-alpha.0'), [
      'robot-stack',
      '26.6.0-alpha.0',
    ])
  })

  it('falls back to legacy tail parsing when regex does not match', () => {
    assert.deepEqual(detailsFromTag('internal@26.5.22-1'), [
      'robot-stack-internal',
      '26.5.22-1',
    ])
    assert.deepEqual(detailsFromTag('v8.9.9-alpha.13'), [
      'robot-stack',
      '8.9.9-alpha.13',
    ])
  })

  it('parses other project@version tags', () => {
    for (const [tag, project, version] of [
      ['labware-library@1.0.0.test', 'labware-library', '1.0.0.test'],
      ['protocol-designer@0.0.1-test', 'protocol-designer', '0.0.1-test'],
      [
        'staging-protocol-designer@0.0.1-alpha.0',
        'staging-protocol-designer',
        '0.0.1-alpha.0',
      ],
      [
        'staging-protocol-designer@0.0.1-test',
        'staging-protocol-designer',
        '0.0.1-test',
      ],
      ['docs@1.2.3', 'docs', '1.2.3'],
    ]) {
      assert.deepEqual(detailsFromTag(tag), [project, version], tag)
    }
  })
})

describe('tagFromDetails', () => {
  it('builds calendar internal and external tags from project and version', () => {
    assert.equal(
      tagFromDetails('robot-stack-internal', '26.5.2601'),
      'internal@26.5.2601'
    )
    assert.equal(
      tagFromDetails('robot-stack-internal', '26.5.2601-alpha'),
      'internal@26.5.2601-alpha'
    )
    assert.equal(
      tagFromDetails('robot-stack-internal', '26.5.2699-beta'),
      'internal@26.5.2699-beta'
    )
    assert.equal(tagFromDetails('robot-stack', '26.6.0'), 'v26.6.0')
    assert.equal(
      tagFromDetails('robot-stack', '26.6.0-alpha.0'),
      'v26.6.0-alpha.0'
    )
    assert.equal(
      tagFromDetails('robot-stack', '26.6.0-alpha.13'),
      'v26.6.0-alpha.13'
    )
    assert.equal(
      tagFromDetails('robot-stack', '28.12.0-beta.999'),
      'v28.12.0-beta.999'
    )
  })

  it('builds project@version tags for non-stack projects', () => {
    assert.equal(tagFromDetails('docs', '1.2.3'), 'docs@1.2.3')
    assert.equal(
      tagFromDetails('protocol-designer', '8.5.0'),
      'protocol-designer@8.5.0'
    )
  })
})

describe('prefixForProject', () => {
  it('returns OT-2 stack tag prefixes', () => {
    assert.equal(prefixForProject('robot-stack-internal'), 'internal@')
    assert.equal(prefixForProject('robot-stack'), 'v')
  })

  it('returns project@ for other monorepo projects', () => {
    assert.equal(prefixForProject('docs'), 'docs@')
    assert.equal(prefixForProject('protocol-designer'), 'protocol-designer@')
  })
})

// Integration test: versionForProject shells out to git (`tag -l --merged HEAD`).
// Requires a full clone with tags (see scripts-release-tag-tests.yaml fetch-depth: 0).
describe('versionForProject', () => {
  it('uses the latest merged calendar internal tag when present', async () => {
    const version = await versionForProject('robot-stack-internal')
    assert.notEqual(version, '0.0.0-dev')
    assert.match(version, /^\d{2}\.(?:[1-9]|1[0-2])\.\d+/)
  })
})
