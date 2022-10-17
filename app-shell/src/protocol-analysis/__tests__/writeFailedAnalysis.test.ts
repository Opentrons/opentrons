import { readFile, rm } from 'fs/promises'
import tempy from 'tempy'

import { writeFailedAnalysis } from '../writeFailedAnalysis'

const ISO_8061_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/

describe('write failed analysis', () => {
  let outputPath: string

  beforeEach(() => {
    outputPath = tempy.file({ extension: 'json' })
  })

  afterEach(() => {
    return rm(outputPath, { force: true })
  })

  it('should write an error report to the filesystem', () => {
    return writeFailedAnalysis(outputPath, 'oh no')
      .then(() => readFile(outputPath))
      .then(contents => {
        const result = JSON.parse(contents.toString())

        expect(result).toEqual({
          createdAt: expect.stringMatching(ISO_8061_DATETIME_RE),
          errors: [
            {
              id: expect.any(String),
              errorType: 'UnexpectedAnalysisError',
              createdAt: expect.stringMatching(ISO_8061_DATETIME_RE),
              detail: 'oh no',
            },
          ],
          files: [],
          config: {},
          metadata: [],
          commands: [],
          labware: [],
          modules: [],
          pipettes: [],
          liquids: [],
        })
      })
  })
})
