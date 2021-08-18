Param(
    [string]$version
)

Invoke-WebRequest "https://chromedriver.storage.googleapis.com/$version/chromedriver_win32.zip" -OutFile chromedriver_win32.zip
# https://github.com/actions/virtual-environments/blob/main/images/win/Windows2019-Readme.md
Expand-Archive -Path chromedriver_win32.zip -DestinationPath C:\SeleniumWebDrivers\ChromeDriver -Force
Remove-Item chromedriver_win32.zip