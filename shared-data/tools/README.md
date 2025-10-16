# Adding Labware Images to `shared-data`

## Upload Process

1. **Format the image(s)**  
   Use `../format_image.py` to process one or more images. This script:
   - Converts the image to `.jpg` format
   - Crops the image
   - Reduces the image file size

   In order to run this script
   - From shard-data, then pipenv run python -m tools/format_image.py "insert image path here"

2. **Name the image file**
   - Include the **labware load name** in the file name.
   - If there are multiple images for a single labware, append a **`_suffix`** (e.g., `_0`, `_1`) that indicates which image should appear first.
   - If the labware includes an opentrons adapter, the adapter image will appear first

3. **Upload the image**
   - Place the image file(s) in the `../images` directory.
