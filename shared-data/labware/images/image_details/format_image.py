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

    # Get bounding box of detected object
    x_coords, y_coords = zip(*non_empty_pixels)
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)

    # Enforce square crop box with margin
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

    output_path = os.path.splitext(path)[0] + "_cropped.png"
    img_cropped.save(output_path, "PNG")
    print(f"✅ Image cropped and saved: {output_path}")
    return output_path

def resize_image(path: str, target_kb: int = 400) -> str:
    """Resize PNG image by downscaling until it's under target size (in KB)."""
    print("📏 Beginning Resize Steps.")

    img = Image.open(path).convert("RGBA")
    target_bytes = target_kb * 1024
    quality_tolerance = 10 * 1024  # 10 KB tolerance
    factor = 0.95  # Resize factor per iteration
    min_size = 500  # Don't resize below this dimension
    output_path = os.path.splitext(path)[0] + "_resized.png"

    while True:
        # Convert to palette mode (lower size)
        img_quantized = img.convert("P", palette=Image.ADAPTIVE, colors=256)
        img_quantized.save(output_path, format="PNG", optimize=True)
        size = os.path.getsize(output_path)

        print(f"Current size: {size // 1024} KB")

        # ✅ Only resize if we're still **over** the target size
        if size <= target_bytes + quality_tolerance or min(img.size) < min_size:
            break

        # Downscale image
        new_size = (int(img.size[0] * factor), int(img.size[1] * factor))
        img = img.resize(new_size, Image.LANCZOS)

    print(f"✅ Final image size: {os.path.getsize(output_path) // 1024} KB")
    return output_path

def convert_to_png(path: str) -> str:
    """Convert image to PNG if it's not already in PNG format."""
    if not path.lower().endswith(".png"):
        # Open the image
        try:
            img = Image.open(path)
        except FileNotFoundError:
            print(f"Error: {path} not found. Please ensure the file exists.")
            exit(1)
        # Prepare PNG output path
        print("📷 Converting image to png...")
        path_base = os.path.basename(path)
        path_dir = os.path.dirname(path)
        name = path_base.split(".")[0]
        png_name = name + ".png"
        output_path = os.path.join(path_dir, png_name)
        # Convert and save as PNG
        try:
            img.save(output_path, "PNG")
            print(f"Image converted successfully to {output_path}")
            return output_path
        except Exception as e:
            print(f"Error saving image: {e}")
            exit(1)
    else:
        return path

def image_sequence(path: str)-> str:
    """Converting image sequence."""
    converted_path = convert_to_png(path)
    cropped_path = crop_image(path)
    return resize_image(cropped_path)

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
    new_paths = []
    # Determine if file is path or folder
    file = False
    if os.path.isfile(path):
        file = True
        new_paths.append(image_sequence(path))
        img = Image.open(new_paths[0])
        img.show()
    else:
        for file in os.listdir(path):
            new_paths.append(image_sequence(path))

    print(f"Converted {len(new_paths)} images.")
    print("--File Path(s)--")
    print(*new_paths, sep = '\n')
