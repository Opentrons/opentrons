import { constants, createWriteStream } from 'fs'
import { access, open } from 'fs/promises'
import path from 'path'
import { ZipArchive } from 'archiver'

import { createLogger } from '../log'

const log = createLogger('fs/utils')

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Avoid silently overwriting an existing path by appending " (n)" before the
 * extension until the path is free (e.g. report.zip → report (1).zip).
 */
export async function resolveUniqueFilePath(
  directory: string,
  name: string
): Promise<string> {
  const parsed = path.parse(name)
  let candidate = path.join(directory, name)
  let n = 1
  while (await pathExists(candidate)) {
    candidate = path.join(directory, `${parsed.name} (${n})${parsed.ext}`)
    n += 1
  }
  return candidate
}

/** Zip the contents of `sourceDir` into `outputPath` (entries at zip root). */
export async function zipDirectory(
  sourceDir: string,
  outputPath: string
): Promise<void> {
  const output = createWriteStream(outputPath)
  const archive = new ZipArchive()
  const archiveClosed = new Promise<void>((resolve, reject) => {
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
  })
  archive.pipe(output)
  archive.directory(sourceDir, false)
  await archive.finalize()
  await archiveClosed
}

async function fsync(target: string): Promise<void> {
  const handle = await open(target, 'r')
  try {
    await handle.sync()
  } finally {
    await handle.close()
  }
}

/**
 * Commit a just-written file to the physical device.
 *
 * Closing a write stream only guarantees the bytes reached the page cache, and
 * the ODD never unmounts USB drives, so a drive pulled after a download would
 * otherwise contain a 0-byte file. Syncing the directory as well commits the
 * FAT entry that holds the file's size.
 */
export async function syncFileToDevice(filePath: string): Promise<void> {
  await fsync(filePath)
  try {
    await fsync(path.dirname(filePath))
  } catch (error) {
    // not every filesystem supports fsync on a directory; the file itself is
    // already durable at this point
    log.warn('Could not sync directory entry', { filePath, error })
  }
}
