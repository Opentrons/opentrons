import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="photometric_ot2",
    version="0.0.1",
    description="Testing photometric measurements on OT2.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    classifiers=[
        "Programming Language :: Python :: 3",
        "Operating System :: OS Independent",
    ],
    package_dir={"photometric_ot2": "photometric_ot2"},
    packages=["photometric_ot2"],
    python_requires=">=3.7",
    install_requires=[],  # assume opentrons is already installed
)
