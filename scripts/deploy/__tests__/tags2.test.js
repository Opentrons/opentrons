import 'regenerator-runtime/runtime'
const git = require('simple-git');
const { versionDetailsFromGit } = require('../create-release')

jest.mock('simple-git', () => {
    return jest.fn().mockImplementation(() => {
        return {
            log: () => Promise.resolve({
                all: [{
                    refs: 'tag: robot-stack@0.0.1, origin/old-branch',
                },
                {
                    refs: 'tag: robot-stack@0.0.2, origin/branch',
                },
                ]
            }),
            tags: () => Promise.resolve({
                all: ['robot-stack@0.0.1','tag: robot-stack@0.0.2'],
                latest: 'robot-stack@0.0.2'
            }),
        };
    });
});

test('the diff', async () => {
    const [
        project,
        currentVersion,
        previousVersion,
    ] = await versionDetailsFromGit('robot-stack@0.0.1', false);
    expect(project).toBe('robot-stack');
    expect(currentVersion).toBe('0.0.2');
    expect(previousVersion).toBe(null)
})