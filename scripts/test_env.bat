cd env-dist

echo "Contents of build dir"
ls -la ..\env-build\

echo "Unzipping env"
7z e -y venv.zip

echo "Contents of current dir"
ls -la .

echo "Activating env"
Scripts\activate.bat %cd%

echo "Contents of env"
pip list

echo "Install opentrons"
pip install opentrons

echo "Successfully ran"
