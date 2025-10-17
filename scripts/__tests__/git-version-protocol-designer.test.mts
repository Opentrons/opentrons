import {
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

/**
 * Mock for the simple-git library's raw() method.
 * By default, throws an error for unexpected git commands.
 */
const rawMock = vi.fn(async (_args: string[]) => {
    throw new Error('unexpected git invocation')
})

vi.mock('simple-git', () => ({
    default: vi.fn(() => ({
        raw: rawMock,
    })),
}))

let versionForProject: (project: string) => Promise<string>

beforeAll(async () => {
    const module = await import('../git-version-protocol-designer.mjs')
    versionForProject = module.versionForProject
})

beforeEach(() => {
    rawMock.mockReset()
})

/**
 * Helper function to create a git mock that simulates a repository state
 * with specific tags and commit distances.
 */
interface TagDistance {
    tag: string
    commitsAhead: number
}

function mockGitWithTags(tagDistances: TagDistance[]) {
    rawMock.mockImplementation(async args => {
        // Handle 'git describe --tags --abbrev=0 --match=<prefix>*'
        if (args[0] === 'describe') {
            const matchArg = args.find(arg => arg.startsWith('--match='))
            const matchPattern = matchArg?.replace('--match=', '')

            // Find the tag that matches this pattern
            for (const { tag } of tagDistances) {
                const prefix = matchPattern?.replace('*', '')
                if (prefix && tag.startsWith(prefix)) {
                    return tag
                }
            }
            throw new Error(`No tags found matching ${matchPattern}`)
        }

        // Handle 'git rev-list <tag>..HEAD --count'
        if (args[0] === 'rev-list' && args[2] === '--count') {
            const range = args[1]
            const tagName = range.split('..')[0]

            // Find the commit distance for this tag
            const tagDistance = tagDistances.find(td => td.tag === tagName)
            if (tagDistance) {
                return String(tagDistance.commitsAhead)
            }
            throw new Error(`Unknown tag in rev-list: ${tagName}`)
        }

        throw new Error(`Unexpected git command: ${args.join(' ')}`)
    })
}

describe('versionForProject', () => {
    describe('protocol-designer project', () => {
        it('selects staging tag when it is closer to HEAD than production tag', async () => {
            // Simulates a git history where:
            // - production tag protocol-designer@8.6.0 is 3 commits behind HEAD
            // - staging tag staging-protocol-designer@8.7.0-alpha.1 is 1 commit behind HEAD
            // Expected: staging tag wins due to shorter distance (1 < 3)
            mockGitWithTags([
                { tag: 'protocol-designer@8.6.0', commitsAhead: 3 },
                { tag: 'staging-protocol-designer@8.7.0-alpha.1', commitsAhead: 1 },
            ])

            const version = await versionForProject('protocol-designer')

            expect(version).toBe('8.7.0-alpha.1')
        })

        it('prefers production tag over staging tag when both are at the same commit', async () => {
            // Simulates a git history where both tags point to HEAD:
            // - production tag protocol-designer@8.6.0-alpha.1 is 0 commits behind HEAD
            // - staging tag staging-protocol-designer@8.6.0-alpha.2 is 0 commits behind HEAD
            // Expected: production tag wins due to prefix priority
            mockGitWithTags([
                { tag: 'protocol-designer@8.6.0-alpha.1', commitsAhead: 0 },
                { tag: 'staging-protocol-designer@8.6.0-alpha.2', commitsAhead: 0 },
            ])

            const version = await versionForProject('protocol-designer')

            expect(version).toBe('8.6.0-alpha.1')
        })

        it('returns production tag version when no staging tags exist', async () => {
            // Simulates a git history where:
            // - production tag protocol-designer@8.6.0 exists at HEAD
            // - no staging tags exist (git describe will throw for staging prefix)
            mockGitWithTags([
                { tag: 'protocol-designer@8.6.0', commitsAhead: 0 },
            ])

            const version = await versionForProject('protocol-designer')

            expect(version).toBe('8.6.0')
        })

        it('falls back to "0.0.0-dev" when no matching tags exist', async () => {
            // Simulates a git history with no protocol-designer tags at all
            rawMock.mockImplementation(async args => {
                if (args[0] === 'describe') {
                    throw new Error('no tags available')
                }
                throw new Error(`Unexpected git command: ${args.join(' ')}`)
            })

            const consoleError = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {})

            const version = await versionForProject('protocol-designer')

            expect(version).toBe('0.0.0-dev')
            expect(consoleError).toHaveBeenCalledWith(
                expect.stringContaining(
                    'Could not find a version for project protocol-designer'
                )
            )

            consoleError.mockRestore()
        })

        it('extracts version by removing prefix after @ symbol', async () => {
            // Verifies that the tag format protocol-designer@X.Y.Z returns X.Y.Z
            mockGitWithTags([
                { tag: 'protocol-designer@8.6.0', commitsAhead: 0 },
            ])

            const version = await versionForProject('protocol-designer')

            expect(version).toBe('8.6.0')
        })
    })
})
