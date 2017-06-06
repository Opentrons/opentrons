
publish () {
    python3 scripts/build_electron_app_with_builder.py
}

TC_TAG=$(git describe --exact-match --tags HEAD)
TC_TAG_RESULT=$?

if [ -z "$TRAVIS_TAG"]; then
    echo "travis tag detected..."
elif [ -z "$APPVEYOR_REPO_TAG_NAME"]; then
    echo "appveyor tag detected.."
elif [ $TC_TAG_RESULT -eq 0]; then
    echo "TC tag detectedd"
fi
