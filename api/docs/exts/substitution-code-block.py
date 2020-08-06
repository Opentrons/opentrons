from typing import List

from sphinx.application import Sphinx
from sphinx.directives.code import CodeBlock


class SubstitutionCodeBlock(CodeBlock):  # type: ignore
    """
    Similar to CodeBlock but replaces placeholders with variables.
    """

    def run(self) -> List:
        """
        Replace placeholders with given variables.
        """
        app = self.state.document.settings.env.app
        new_content = []
        self.content = self.content  # type: List[str]
        existing_content = self.content
        for item in existing_content:
            for pair in app.config.substitutions:
                original, replacement = pair
                item = item.replace(original, replacement)
            new_content.append(item)

        self.content = new_content
        return list(CodeBlock.run(self))


def setup(app: Sphinx) -> None:
    """
    Add the custom directives to Sphinx.
    """
    app.add_config_value('substitutions', [], 'html')
    app.add_directive('substitution-code-block', SubstitutionCodeBlock)