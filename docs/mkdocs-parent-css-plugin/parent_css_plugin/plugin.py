import os
from mkdocs.plugins import BasePlugin
from mkdocs.structure.files import File
import logging


class ParentCssPlugin(BasePlugin):
    """
    An MkDocs plugin that allows `extra_css` to reference files in parent directories.
    """

    def on_files(self, files, config):
        """
        This event is called by MkDocs after the initial file list is populated.
        We use it to find, copy, and reference CSS files from outside the docs_dir.
        """

        # Get the directory of the mkdocs.yml file.
        config_dir = os.path.dirname(config.config_file_path)

        new_extra_css = []

        for css_path in config.get("extra_css", []):
            normed = os.path.normpath(css_path)
            if normed.startswith("..") or (
                os.path.isabs(css_path) and not normed.startswith(config["docs_dir"])
            ):
                source_path = os.path.normpath(os.path.join(config_dir, css_path))

                log = logging.getLogger("mkdocs.plugins.parent-css-plugin")

                if os.path.exists(source_path):
                    dest_filename = os.path.basename(source_path)

                    # Create a new MkDocs File object.
                    file = File(
                        path=dest_filename,
                        src_dir=os.path.dirname(source_path),
                        dest_dir=config["site_dir"],
                        use_directory_urls=config.get("use_directory_urls", True),
                    )

                    files.append(file)

                    # Update the path in our new list to point to the file's new location at the root of the site.
                    new_extra_css.append(dest_filename)
                    log.info(f"Copied '{source_path}' to '{dest_filename}'")
                else:
                    # If the file doesn't exist, just keep the original path and let MkDocs handle the warning.
                    new_extra_css.append(css_path)
                    log.warning(f"CSS file not found at '{source_path}'")
            else:
                # If it's a normal path, just add it back to the list without changes.
                new_extra_css.append(css_path)

        config["extra_css"] = new_extra_css

        return files
