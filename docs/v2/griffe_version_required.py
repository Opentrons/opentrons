"""
Griffe extension to support a custom @requires_version decorator.
"""
import griffe
import re

class RequiresVersionExtension(griffe.Extension):
    def on_function_instance(self, *, func, **kwargs):
        for decorator in getattr(func, "decorators", []):
            callable_path = getattr(decorator, "callable_path", None)
            if callable_path == "opentrons.protocols.api_support.util.requires_version":
                value_str = str(getattr(decorator, "value", ""))
                match = re.search(r"requires_version\((\d+),\s*(\d+)\)", value_str)
                if match:
                    major, minor = match.groups()
                    version_text = f"v{major}.{minor}"
                    func.labels.add(version_text)
