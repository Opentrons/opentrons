import os
import re
from pathlib import Path

# --- SCOPED CONFIGURATION ---
# Place and execute this script inside your "vacuum/docs" folder
DOCS_DIR = Path(".")              # Current directory (vacuum/docs)
IMAGES_DIR = Path("./images")      # Target image subdirectory (vacuum/docs/images)
# ----------------------------

def get_physical_images(images_dir):
    """Finds all physical .png and .svg files in the target images folder."""
    valid_extensions = {'.png', '.svg'}
    image_files = set()
    
    if not images_dir.exists():
        print(f"Error: Images directory '{images_dir}' does not exist.")
        return image_files

    for root, _, files in os.walk(images_dir):
        for file in files:
            file_path = Path(root) / file
            if file_path.suffix.lower() in valid_extensions:
                image_files.add(file_path.resolve())
    return image_files

def find_image_references(docs_dir):
    """Scans .md files for markdown and HTML image paths."""
    referenced_patterns = [
        re.compile(r'!\[.*?\]\((.*?)\)'),    # Markdown: ![alt](path)
        re.compile(r'src=["\'](.*?)["\']'),  # HTML tags: src="path"
    ]
    
    used_images = set()
    
    if not docs_dir.exists():
        print(f"Error: Docs directory '{docs_dir}' does not exist.")
        return used_images

    for root, _, files in os.walk(docs_dir):
        for file in files:
            if not file.endswith('.md'):
                continue
                
            file_path = Path(root) / file
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for pattern in referenced_patterns:
                    matches = pattern.findall(content)
                    for match in matches:
                        # Strip width/styling blocks, query parameters, or anchors
                        clean_path = match.split('{')[0].split('?')[0].split('#')[0].split(' "')[0].split(" '")[0].strip()
                        if clean_path:
                            # Resolve path relative to the specific file it was found in
                            absolute_ref = (Path(root) / clean_path).resolve()
                            used_images.add(absolute_ref)
            except Exception as e:
                print(f"Warning: Could not read file {file_path} due to {e}")
                
    return used_images

def main():
    print(f"Parsing project directory for image assets...")
    physical_images = get_physical_images(IMAGES_DIR)
    
    if not physical_images:
        print(f"No .png or .svg images found in targeted subdirectory: '{IMAGES_DIR}'.")
        return

    print(f"Found {len(physical_images)} physical .png/.svg files in {IMAGES_DIR}.")
    print(f"Scanning Markdown files inside {DOCS_DIR} for references...")
    referenced_images = find_image_references(DOCS_DIR)

    # Calculate orphan image files
    unused_images = physical_images - referenced_images

    print("\n" + "="*50)
    print(" SCOPED RESULTS: VACUUM IMAGES")
    print("="*50)
    
    if unused_images:
        print(f"Found {len(unused_images)} unused image assets:\n")
        for img in sorted(unused_images):
            try:
                print(f"  - {img.relative_to(Path.cwd())}")
            except ValueError:
                print(f"  - {img}")
        print("\nVerification complete. Ensure these are not referenced in configs before purging.")
    else:
        print("Clean sweep! All .png and .svg files in the images folder are actively referenced.")

if __name__ == "__main__":
    main()