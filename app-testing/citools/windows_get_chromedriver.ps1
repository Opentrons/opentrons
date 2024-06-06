Param(
    [string]$version
)

Invoke-WebRequest "https://github.com/electron/electron/releases/download/v$version/chromedriver-v$version-win32-x64.zip" -OutFile chromedriver.zip
# https://github.com/actions/virtual-environments/blob/main/images/win/Windows2019-Readme.md
Expand-Archive -Path chromedriver.zip -DestinationPath C:\SeleniumWebDrivers\ChromeDriver -Force
Remove-Item chromedriver.zip
[Environment]::SetEnvironmentVariable("Path", $Env:Path + ";C:\SeleniumWebDrivers\ChromeDriver", [EnvironmentVariableTarget]::Machine)
