from setuptools import setup, find_packages

setup(
    name='mkdocs-parent-css-plugin',
    version='1.0.0',
    description='An MkDocs plugin to allow extra_css from parent directories.',
    long_description='A simple MkDocs plugin that allows the extra_css setting in mkdocs.yml to include CSS files from directories above the docs folder.',
    author='Ed Cormany',
    author_email='edward.cormany@opentrons.com',
    url='https://github.com/your-username/mkdocs-parent-css-plugin',
    license='MIT',
    packages=find_packages(),
    install_requires=[
        'mkdocs>=1.0'
    ],
    entry_points={
        'mkdocs.plugins': [
            'parent-css = parent_css_plugin.plugin:ParentCssPlugin'
        ]
    }
)
