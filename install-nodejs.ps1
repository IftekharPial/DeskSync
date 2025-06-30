# Node.js Installation Script
Write-Host "🚀 Installing Node.js..." -ForegroundColor Green

# Download URL for Node.js LTS
$url = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi"
$output = "$env:TEMP\nodejs-installer.msi"

try {
    Write-Host "📥 Downloading Node.js installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "✅ Download completed" -ForegroundColor Green
    
    Write-Host "🔧 Installing Node.js..." -ForegroundColor Yellow
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$output`" /quiet /norestart"
    Write-Host "✅ Installation completed" -ForegroundColor Green
    
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    Remove-Item $output -Force
    
    Write-Host "🔄 Refreshing environment variables..." -ForegroundColor Yellow
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "✅ Node.js installation complete!" -ForegroundColor Green
    Write-Host "Please restart your terminal and run 'node --version' to verify" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error during installation: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
