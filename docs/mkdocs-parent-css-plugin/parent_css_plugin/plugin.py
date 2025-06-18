import os
from mkdocs.plugins import BasePlugin
from mkdocs.structure.files import File

class ParentCssPlugin(BasePlugin):
    """
    An MkDocs plugin that allows `extra_css` to reference files in parent directories.
    """

    def on_files(self, files, config):
        """
        This event is called by MkDocs after the initial file list is populated.
        We use it to find, copy, and reference CSS files from outside the docs_dir.
        """
        
        # Get the directory of the mkdocs.yml file. All relative paths will be resolved from here.
        config_dir = os.path.dirname(config.config_file_path)
        
        # We need to create a new list for extra_css because we might modify the paths.
        # Direct modification while iterating can be problematic.
        new_extra_css = []

        for css_path in config.get('extra_css', []):
            # Check if the path is trying to access a parent directory.
            if '../' in css_path:
                # Resolve the absolute path of the source CSS file.
                # This joins the mkdocs.yml directory with the user-provided relative path.
                # For example, '/path/to/project' + '../../style.css' -> '/path/style.css'
                source_path = os.path.abspath(os.path.join(config_dir, css_path))

                # Check if the source file actually exists before proceeding.
                if os.path.exists(source_path):
                    # Get just the filename (e.g., 'my_custom_style.css').
                    # This will be the destination path within the site_dir.
                    dest_filename = os.path.basename(source_path)
                    
                    # Create a new MkDocs File object. This object tells MkDocs:
                    # 1. 'path': The destination path for the file inside the final 'site' directory.
                    # 2. 'src_dir': The directory where the source file is located.
                    # 3. 'dest_dir': The root directory for the built site.
                    # 4. 'use_directory_urls': A config option that needs to be passed along.
                    file = File(
                        path=dest_filename,
                        src_dir=os.path.dirname(source_path),
                        dest_dir=config['site_dir'],
                        use_directory_urls=config.get('use_directory_urls', True)
                    )
                    
                    # Add the newly created File object to MkDocs' list of files to process.
                    # MkDocs will now handle copying this file into the site_dir during the build.
                    files.append(file)
                    
                    # Update the path in our new list to point to the file's new location at the root of the site.
                    new_extra_css.append(dest_filename)
                    print(f"INFO    -  parent-css-plugin: Copied '{source_path}' to '{dest_filename}'")
                else:
                    # If the file doesn't exist, just keep the original path and let MkDocs handle the warning.
                    new_extra_css.append(css_path)
                    print(f"WARNING -  parent-css-plugin: CSS file not found at '{source_path}'")
            else:
                # If it's a normal path, just add it back to the list without changes.
                new_extra_css.append(css_path)
        
        # Replace the original extra_css config with our new list that contains the updated paths.
        config['extra_css'] = new_extra_css
        
        return files
