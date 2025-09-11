# /// script
# requires-python = ">=3.8"
# dependencies = [
#   "pillow",
#   "rembg",
#   "onnxruntime"
# ]
# ///

"""Crop Images so that Labware is Centered and Change File Size and Type to JPG."""

from PIL import Image
from rembg import remove
import argparse
import os
import io

def rename_image_path(image_path: str, keyword: str)-> str:
    """Save image to new path."""
    image_path_dir = os.path.dirname(image_path)
    name = os.path.splitext(os.path.basename(image_path))[0]
    new_image_path = os.path.join(image_path_dir, name + f"_{keyword}.jpg")
    return new_image_path

def crop_image(image_path: str) -> str:
    """Crop image to a rectangular object region by removing surrounding white space."""
    print("✂️ Beginning Crop Steps.")
    try:
        img = Image.open(image_path).convert("RGB")
    except FileNotFoundError:
        print(f"File not found: {image_path}")
        return image_path
    cropped_image_path = rename_image_path(image_path, "crop")
    datas = img.getdata()
    non_empty_pixels = []
    for y in range(img.height):
        for x in range(img.width):
            pixel = img.getpixel((x, y))
            # Assuming object is not pure white or fully transparent
            if pixel!= (240, 240, 240):
                non_empty_pixels.append((x, y))

    if not non_empty_pixels:
        print("❌ Could not detect object.")
        return image_path

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
    img_cropped = img_cropped.convert("RGB")

    # Overwrite original file
    img_cropped.save(cropped_image_path, "JPEG")
    print(f"✅ Image cropped and saved: {cropped_image_path}")
    return cropped_image_path

def remove_background_and_replace_with_white(image_path: str)-> str:
    """Remove background and replace with white."""
    print("🖼️ Beginning remove background and replace with white steps.")
    # Remove background
    with open(image_path, "rb") as image_file:
        image_data = image_file.read()
    no_bkgrnd = remove(image_data)
    img_transparent = Image.open(io.BytesIO(no_bkgrnd))
    # Add white background
    white_bkgrnd = Image.new("RGB", img_transparent.size,(255, 255, 255) )
    white_bkgrnd.paste(img_transparent, (0,0), img_transparent)
    bkgrnd_image_path = rename_image_path(image_path, "bkgrnd")
    white_bkgrnd.save(bkgrnd_image_path, "JPEG")
    return bkgrnd_image_path
    
    
def resize_image(image_path: str, new_width: int = 1024) -> str:
    """Resize JPG image by downscaling until it's under target size (in KB)."""
    print("📏 Beginning resize Steps.")
    img = Image.open(image_path).convert("RGB")
    # Calculate new height to maintain aspect ratio
    original_width, original_height = img.size
    aspect_ratio = original_height / original_width
    new_height = int(new_width * aspect_ratio)
    # Resize the image
    resized_img = img.resize((new_width, new_height), Image.LANCZOS) # LANCZOS for high-quality downsampling
    resize_image_path = rename_image_path(image_path, "resize")
    resized_img.save(resize_image_path, "JPEG", quality=98, optimize=True)
    print(f"✅ Final image size: {os.path.getsize(image_path) // 1024} KB")
    return resize_image_path

def convert_to_jpg(mage_path: str) -> str:
    """Convert image to JPG if it's not already JPG."""
    if not image_path.lower().endswith(".jpg"):
        try:
            img = Image.open(image_path)
        except Exception as e:
            print(f"Failed to read file {image_path}")
            return ""

        print("📷 Converting image to JPG...")
        image_jpg = rename_image_path(image_path, "jpg")
        try:
            if img.mode == 'RGBA':
                background = Image.new("RGB", img.size, (255, 255, 255))  # white background
                background.paste(img, mask=img.split()[3])  # 3 is the alpha channel
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(image_jpg, "JPEG")
            print(f"Image converted successfully to {image_jpg}")
            return image_jpg
        except Exception as e:
            print(f"Error saving image: {e}")
            exit(1)
    else:
        return image_path

def image_sequence(image_path: str) -> str:
    """Run conversion, crop, and resize on image, overwriting original."""
    image_path = convert_to_jpg(image_path)  
    if len(image_path) > 0:
        #image_path = remove_background_and_replace_with_white(image_path)
        image_path = crop_image(image_path) 
        image_path = resize_image(image_path)    
    return image_path

def is_image_file(filename):
    valid_extensions = ('.jpg', '.png', '.jpeg', '.bmp', '.gif', '.tiff', '.webp', '.psd')
    return filename.lower().endswith(valid_extensions)

def process_image_path(image_path):
    """Process a single image or all valid images in a folder."""
    new_image_paths = []
    def _process_if_valid(img_path):
        if os.path.isfile(img_path) and is_image_file(img_path):
            return new_image_paths.append(img_path)
        else:
            print(f"Skipping non-image or non-file: {img_path}")
            return None
    if os.path.isfile(image_path):
        result = _process_if_valid(image_path)
        if result:
            new_image_paths.append(result)
    elif os.path.isdir(image_path):
        for filename in os.listdir(image_path):
            file_path = os.path.join(image_path, filename)
            result = _process_if_valid(file_path)
            if result:
                new_image_paths.append(result)
    else:
        print(f"❌ Provided path is neither a valid file nor a directory: {image_path}")
    return new_image_paths


if __name__ == "__main__":
    """Convert Image into Opentrons Format."""
    parser = argparse.ArgumentParser(description="Change format of multiple images or images in folder.")
    parser.add_argument(
        "image_path",
        metavar="PATH",
        type=str,
        nargs=1,
        help="Path to Individual File or Folder of Files"
    )
    args = parser.parse_args()
    image_path = args.image_path[0]
    # Determine if file is image_path or folder
    new_image_paths = process_image_path(image_path)
    converted_image_paths = []
    print(new_image_paths)
    for file in new_image_paths:
        converted_image_paths.append(image_sequence(image_path))

    print(f"Converted {len(converted_image_paths)} images.")
    print("--File Path(s)--")
    print(*converted_image_paths, sep = '\n')
