"""
Griffe extension to support a custom @requires_version decorator.
"""
import ast
import griffe
import re

class RequiresVersionExtension(griffe.Extension):
    def on_function_instance(self, *, func, **kwargs):
        print(f"{func} {getattr(func, 'decorators', [])}")
        for decorator in getattr(func, "decorators", []):
            callable_path = getattr(decorator, "callable_path", None)
            if callable_path == "opentrons.protocols.api_support.util.requires_version":
                value_str = str(getattr(decorator, "value", ""))
                match = re.search(r"requires_version\((\d+),\s*(\d+)\)", value_str)
                if match:
                    major, minor = match.groups()
                    version_text = f"v{major}.{minor}"
                    func.labels.add(version_text)
    def on_attribute_instance(self, *, node, attr, **kwargs):
        print(f"Node: {node} {attr} {getattr(node, 'decorator_list', [])}")
        for decorator in getattr(node, "decorator_list", []):
            if isinstance(decorator, ast.Call):
                print(f"Node {attr}: {decorator.func.id} {[arg.value for arg in decorator.args]} {decorator.keywords}")
                if "requires_version" in decorator.func.id:
                    major, minor = [arg.value for arg in decorator.args]
                    version_text = f"v{major}.{minor}"
                    attr.labels.add(version_text)
