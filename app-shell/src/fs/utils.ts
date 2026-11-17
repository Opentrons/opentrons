import { constants, createWriteStream } from 'fs'
import { access } from 'fs/promises'
import path from 'path'
import { ZipArchive } from 'archiver'

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
