import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

// ✅ List of image filenames to ignore (case-sensitive)
const ignoredImages = new Set([
  'opentrons_flat_aluminumblock_side_view.jpg',
  'plate_multi.png',
  'plate_single.png',
  'removable_black_plastic_trash_bin.png',
  'tipone_200ul_tip_side_view.jpg',
])

// If this test fails, run ../labware-images.ts to regenerate imports
function getAllFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const res = path.resolve(dir, entry.name)
    return entry.isDirectory() ? getAllFiles(res) : res
  })
}

describe('Image import verification', () => {
  const imageDir = path.resolve(__dirname, '../../labware/images')
  const importFilePath = path.resolve(
    __dirname,
    '../../labware/images/image_details/labware-images-generated.ts'
  )

  it('should import all image files unless explicitly ignored', () => {
    const importFileContent = fs.readFileSync(importFilePath, 'utf-8')

    const imageFiles = getAllFiles(imageDir).filter(file =>
      /\.(jpg|jpeg|png|svg)$/i.test(file)
    )

    const notImported: string[] = []

    for (const fullPath of imageFiles) {
      const filename = path.basename(fullPath)
      if (ignoredImages.has(filename)) continue

      const pattern = new RegExp(`['"][^'"]*${filename}['"]`, 'i')
      if (!pattern.test(importFileContent)) {
        notImported.push(filename)
      }
    }

    if (notImported.length > 0) {
      console.warn('Missing imports for:', notImported)
    }

    expect(notImported).toEqual([])
  })
})
