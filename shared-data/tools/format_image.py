"""Crop Images so that Labware is Centered and Change File Size and Type to PNG."""

from PIL import Image, ImageEnhance
import argparse
import os


def crop_image(path: str) -> str:
    """Crop image to a rectangular object region by removing surrounding white space."""
    print("✂️ Beginning Crop Steps.")
    try:
        img = Image.open(path).convert("RGBA")
    except FileNotFoundError:
        print(f"File not found: {path}")
        return path

    datas = img.getdata()
    non_empty_pixels = []
    for y in range(img.height):
        for x in range(img.width):
            pixel = img.getpixel((x, y))
            # Assuming object is not pure white or fully transparent
            if pixel[3] > 0 and pixel[:3] != (240, 240, 240):
                non_empty_pixels.append((x, y))

    if not non_empty_pixels:
        print("❌ Could not detect object.")
        return path

    x_coords, y_coords = zip(*non_empty_pixels)
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)

    margin = 200
    width = max_x - min_x
    height = max_y - min_y
    side = max(width, height)

    center_x = (min_x + max_x) // 2
    center_y = (min_y + max_y) // 2

    half_side = side // 2 + margin

    crop_left = max(center_x - half_side, 0)
    crop_upper = max(center_y - half_side, 0)
    crop_right = min(center_x + half_side, img.width)
    crop_lower = min(center_y + half_side, img.height)

    bbox = (crop_left, crop_upper, crop_right, crop_lower)
    img_cropped = img.crop(bbox)

    # Overwrite original file
    img_cropped.save(path, "PNG")
    print(f"✅ Image cropped and saved: {path}")
    return path


from PIL import Image
import os

def resize_image(path: str, target_kb: int = 200) -> str:
    """Resize PNG image by downscaling until it's under target size (in KB)."""
    print("📏 Beginning Resize Steps.")

    img = Image.open(path).convert("RGBA")
    target_bytes = target_kb * 1024
    quality_tolerance = 10 * 1024  # 10 KB tolerance
    factor = 0.8  # Resize factor per iteration — try larger steps
    min_size = 170  # Don't resize below this dimension

    while True:
        # Quantize to reduce colors and file size
        img_quantized = img.convert("P", palette=Image.ADAPTIVE, colors=256)
        img_quantized.save(path, format="PNG", optimize=True)  # overwrite original
        
        size = os.path.getsize(path)
        print(f"Current size: {size // 1024} KB, dimensions: {img.size}")

        # Stop if size is below target or image is too small to resize further
        if size <= target_bytes + quality_tolerance or min(img.size) < min_size:
            break

        # Resize image for next iteration
        new_size = (int(img.size[0] * factor), int(img.size[1] * factor))
        img = img.resize(new_size, Image.LANCZOS)

    print(f"✅ Final image size: {os.path.getsize(path) // 1024} KB")
    return path




def convert_to_png(path: str) -> str:
    """Convert image to PNG if it's not already PNG."""
    if not path.lower().endswith(".png"):
        try:
            img = Image.open(path)
        except Exception as e:
            print(f"Failed to read file {path}")
            return ""

        print("📷 Converting image to PNG...")
        path_dir = os.path.dirname(path)
        name = os.path.splitext(os.path.basename(path))[0]
        png_path = os.path.join(path_dir, name + ".png")

        try:
            img.save(png_path, "PNG")
            print(f"Image converted successfully to {png_path}")
            return png_path
        except Exception as e:
            print(f"Error saving image: {e}")
            exit(1)
    else:
        return path


def image_sequence(path: str) -> str:
    """Run conversion, crop, and resize on image, overwriting original."""
    path = convert_to_png(path)  
    if len(path) > 0:
        path = crop_image(path)      
        path = resize_image(path)    
    return path

def is_image_file(filename):
    valid_extensions = ('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.tiff', '.webp')
    return filename.lower().endswith(valid_extensions)

def process_path(path):
    new_paths = []
    if os.path.isfile(path) and is_image_file(path):
        # Single file
        new_paths.append(image_sequence(path))
    elif os.path.isdir(path):
        # Folder - process each file inside
        for filename in os.listdir(path):
            file_path = os.path.join(path, filename)
            if os.path.isfile(file_path) and is_image_file(filename):
                new_paths.append(image_sequence(file_path))
            else:
                print(f"Skipping non-image or non-file: {file_path}")
    else:
        print(f"Provided path is neither a file nor a directory: {path}")
    return new_paths

if __name__ == "__main__":
    """Convert Image into Opentrons Format."""
    parser = argparse.ArgumentParser(description="Change format of multiple images or images in folder.")
    parser.add_argument(
        "path",
        metavar="PATH",
        type=str,
        nargs=1,
        help="Path to Individual File or Folder of Files"
    )
    args = parser.parse_args()
    path = args.path[0]
    # Determine if file is path or folder
    new_paths = process_path(path)
    file = False
    converted_paths = []
    for file in new_paths:
        converted_paths.append(image_sequence(path))

    print(f"Converted {len(converted_paths)} images.")
    print("--File Path(s)--")
    print(*converted_paths, sep = '\n')
