# Fortivo AWS Deployment Script for PowerShell
$ErrorActionPreference = "Stop"

Write-Host "Fortivo AWS Deployment Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if AWS CLI is installed
try {
    $null = Get-Command aws -ErrorAction Stop
} catch {
    Write-Host "Error: AWS CLI is not installed" -ForegroundColor Red
    exit 1
}

# Check if Docker is installed
try {
    $null = Get-Command docker -ErrorAction Stop
} catch {
    Write-Host "Error: Docker is not installed" -ForegroundColor Red
    exit 1
}

# Check if Terraform is installed
try {
    $null = Get-Command terraform -ErrorAction Stop
} catch {
    Write-Host "Error: Terraform is not installed" -ForegroundColor Red
    exit 1
}

# Get AWS account ID and region
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$AWS_REGION = (aws configure get region)
if ([string]::IsNullOrEmpty($AWS_REGION)) {
    $AWS_REGION = "us-east-1"
}

Write-Host "AWS Account: $AWS_ACCOUNT_ID" -ForegroundColor Yellow
Write-Host "AWS Region: $AWS_REGION" -ForegroundColor Yellow

# Navigate to project root
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptPath
Set-Location $ProjectRoot

# Check if terraform.tfvars exists
if (-not (Test-Path "infra/terraform/terraform.tfvars")) {
    Write-Host "Creating terraform.tfvars from example..." -ForegroundColor Yellow
    Copy-Item "infra/terraform/terraform.tfvars.example" "infra/terraform/terraform.tfvars"
    Write-Host "Please edit infra/terraform/terraform.tfvars with your configuration before continuing" -ForegroundColor Red
    exit 1
}

# Initialize Terraform
Write-Host "Initializing Terraform..." -ForegroundColor Green
Set-Location "infra/terraform"
terraform init

# Get ECR repository URLs from Terraform
Write-Host "Getting ECR repository URLs..." -ForegroundColor Green
try {
    $ECR_BACKEND = terraform output -raw ecr_backend_repository_url
    $ECR_FRONTEND = terraform output -raw ecr_frontend_repository_url
} catch {
    Write-Host "ECR repositories not found. Creating infrastructure..." -ForegroundColor Yellow
    terraform apply -target=module.ecr_backend -target=module.ecr_frontend -auto-approve
    $ECR_BACKEND = terraform output -raw ecr_backend_repository_url
    $ECR_FRONTEND = terraform output -raw ecr_frontend_repository_url
}

Write-Host "Backend ECR: $ECR_BACKEND" -ForegroundColor Green
Write-Host "Frontend ECR: $ECR_FRONTEND" -ForegroundColor Green

# Login to ECR
Write-Host "Logging in to ECR..." -ForegroundColor Green
$ECR_PASSWORD = aws ecr get-login-password --region $AWS_REGION
$ECR_PASSWORD | docker login --username AWS --password-stdin $ECR_BACKEND

# Build and push backend
Write-Host "Building backend Docker image..." -ForegroundColor Green
Set-Location "$ProjectRoot/server"
docker build -f Dockerfile.prod -t "${ECR_BACKEND}:latest" .
Write-Host "Pushing backend image..." -ForegroundColor Green
docker push "${ECR_BACKEND}:latest"

# Build and push frontend
Write-Host "Building frontend Docker image..." -ForegroundColor Green
Set-Location $ProjectRoot
docker build -f Dockerfile.prod -t "${ECR_FRONTEND}:latest" .
Write-Host "Pushing frontend image..." -ForegroundColor Green
docker push "${ECR_FRONTEND}:latest"

# Apply Terraform to deploy infrastructure
Write-Host "Deploying infrastructure with Terraform..." -ForegroundColor Green
Set-Location "$ProjectRoot/infra/terraform"
terraform apply

$ALB_URL = terraform output -raw alb_url
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Application URL: $ALB_URL" -ForegroundColor Yellow

