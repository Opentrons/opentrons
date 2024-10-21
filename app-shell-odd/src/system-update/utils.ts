import { rm } from 'fs/promises'
import tempy from 'tempy'

export const directoryWithCleanup = <T>(
  task: (directory: string) => Promise<T>
): Promise<T> => {
  const directory = tempy.directory()
  return new Promise<T>((resolve, reject) =>
    task(directory as string)
      .then(result => {
        resolve(result)
      })
      .catch(err => {
        reject(err)
      })
      .finally(() => rm(directory as string, { recursive: true, force: true }))
  )
}
