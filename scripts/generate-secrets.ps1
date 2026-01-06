# Generate secure random strings for Terraform variables
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$dbPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})

Write-Host "Generated Secrets:" -ForegroundColor Green
Write-Host "JWT_SECRET: $jwtSecret" -ForegroundColor Yellow
Write-Host "DB_PASSWORD: $dbPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "These values have been saved to infra/terraform/terraform.tfvars" -ForegroundColor Green

# Create tfvars file
$tfvarsContent = @"
aws_region = "us-east-1"
app_name   = "fortivo"

# Database configuration
db_name     = "fortivo"
db_username = "fortivo_admin"
db_password = "$dbPassword"
db_instance_class = "db.t3.micro"

# JWT Secret
jwt_secret = "$jwtSecret"

# CORS origin (use your domain or ALB DNS name)
cors_origin = "*"

# Resource sizing
server_cpu    = 256
server_memory = 512
frontend_cpu  = 256
frontend_memory = 512

# Desired task counts
server_desired_count   = 1
frontend_desired_count = 1
"@

$projectRoot = Split-Path -Parent $PSScriptRoot
$tfvarsPath = Join-Path $projectRoot "infra\terraform\terraform.tfvars"
$tfvarsContent | Out-File -FilePath $tfvarsPath -Encoding utf8 -NoNewline

Write-Host "File created at: $tfvarsPath" -ForegroundColor Green

