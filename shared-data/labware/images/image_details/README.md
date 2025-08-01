# Adding Labware Images to `shared-data`

## Upload Process

1. **Format the image(s)**  
   Use `../format_image.py` to process one or more images. This script:
   - Crops the image  
   - Reduces the image file size  
   - Converts the image to `.png` format

2. **Name the image file**  
   - Include the **labware load name** in the file name.  
   - If there are multiple images for a single labware, append a descriptive **`_suffix`** (e.g., `_side_view`, `_top_view`).

3. **Upload the image**  
   - Place the image file(s) in the `../images` directory.

4. **Register the image in code**  
   - Run `../labware-images.ts` to ensure the image(s) are properly imported into the `labwareImages` map.
