import { writeFile } from 'fs/promises'
import path from 'path'
import tempy from 'tempy'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { syncFileToDevice } from '../utils'

vi.mock('../../log', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}))

describe('app-shell-odd fs/utils', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = tempy.directory()
  })

  describe('syncFileToDevice', () => {
    it('resolves once the file and its directory entry are flushed', async () => {
      const filePath = path.join(tempDir, 'run.zip')
      await writeFile(filePath, 'zip-bytes')

      await expect(syncFileToDevice(filePath)).resolves.toBeUndefined()
    })

    it('rejects when the file is missing', async () => {
      await expect(
        syncFileToDevice(path.join(tempDir, 'nope.zip'))
      ).rejects.toThrow('ENOENT')
    })
  })
})
