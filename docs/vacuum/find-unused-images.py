# Define paths based on your monorepo structure
import os
import re

# Updated paths for running directly from inside the /vacuum directory
DOCS_DIR = "docs"
IMAGES_DIR = os.path.join("docs", "images")

def get_all_images(images_dir):
    """Returns a set of all PNG and SVG file names in the images directory."""
    valid_extensions = ('.png', '.svg')
    if not os.path.exists(images_dir):
        print(f"Error: Images directory not found at {images_dir}")
        return set()
    
    return {
        f for f in os.listdir(images_dir) 
        if f.lower().endswith(valid_extensions) and os.path.isfile(os.path.join(images_dir, f))
    }

def find_used_images(docs_dir):
    """Scans all flat MD files in the docs directory for image references."""
    used_images = set()
    
    # Regex patterns to capture filenames from standard Markdown and HTML <img> tags
    # Handles options like { dark-invert }, class="screenshot", and relative paths
    markdown_pattern = re.compile(r'!\[.*?\]\((?:\.\./)?images/([^)\s]+)')
    html_pattern = re.compile(r'<img\s+[^>]*src=["\'](?:\.\./)?images/([^"\']+)["\']')

    if not os.path.exists(docs_dir):
        print(f"Error: Docs directory not found at {docs_dir}")
        return used_images

    # Scan only the flat directory (no subdirectories as per constraints)
    for entry in os.scandir(docs_dir):
        if entry.is_file() and entry.name.endswith('.md'):
            with open(entry.path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Find standard markdown images: ![alt](../images/pic.png)
                for match in markdown_pattern.findall(content):
                    # Clean up trailing attribute wrappers like { dark-invert } or widths
                    clean_name = match.split('{')[0].strip()
                    used_images.add(clean_name)
                    
                # Find HTML images: <img src="../images/pic.svg">
                for match in html_pattern.findall(content):
                    used_images.add(match.strip())
                    
    return used_images

def main():
    print("=" * 60)
    print(f"Scanning Opentrons Vacuum Module Docs for Unused Images")
    print("=" * 60)
    
    actual_images = get_all_images(IMAGES_DIR)
    used_images = find_used_images(DOCS_DIR)
    
    if not actual_images:
        print("No source images found to verify.")
        return

    # Determine unused files by subtracting used images from actual folder contents
    unused_images = actual_images - used_images
    
    print(f"Total images found in directory: {len(actual_images)}")
    print(f"Total unique images referenced in docs: {len(used_images)}")
    print("-" * 60)
    
    if unused_images:
        print(f"🚨 Found {len(unused_images)} unused image file(s):\n")
        for img in sorted(unused_images):
            print(f"  - {os.path.join(IMAGES_DIR, img)}")
        print("\nFeel free to safely delete or archive these files.")
    else:
        print("🎉 Clean sweep! Every image in the directory is actively referenced.")
    print("=" * 60)

if __name__ == "__main__":
    main()