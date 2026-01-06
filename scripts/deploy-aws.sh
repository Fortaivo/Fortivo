#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Fortivo AWS Deployment Script${NC}"
echo "=================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    exit 1
fi

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")

echo -e "${YELLOW}AWS Account: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${YELLOW}AWS Region: ${AWS_REGION}${NC}"

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if terraform.tfvars exists
if [ ! -f "infra/terraform/terraform.tfvars" ]; then
    echo -e "${YELLOW}Creating terraform.tfvars from example...${NC}"
    cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
    echo -e "${RED}Please edit infra/terraform/terraform.tfvars with your configuration before continuing${NC}"
    exit 1
fi

# Initialize Terraform
echo -e "${GREEN}Initializing Terraform...${NC}"
cd infra/terraform
terraform init

# Get ECR repository URLs from Terraform
echo -e "${GREEN}Getting ECR repository URLs...${NC}"
ECR_BACKEND=$(terraform output -raw ecr_backend_repository_url 2>/dev/null || echo "")
ECR_FRONTEND=$(terraform output -raw ecr_frontend_repository_url 2>/dev/null || echo "")

# If repositories don't exist, create infrastructure first
if [ -z "$ECR_BACKEND" ] || [ -z "$ECR_FRONTEND" ]; then
    echo -e "${YELLOW}ECR repositories not found. Creating infrastructure...${NC}"
    terraform apply -target=module.ecr_backend -target=module.ecr_frontend -auto-approve
    ECR_BACKEND=$(terraform output -raw ecr_backend_repository_url)
    ECR_FRONTEND=$(terraform output -raw ecr_frontend_repository_url)
fi

echo -e "${GREEN}Backend ECR: ${ECR_BACKEND}${NC}"
echo -e "${GREEN}Frontend ECR: ${ECR_FRONTEND}${NC}"

# Login to ECR
echo -e "${GREEN}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_BACKEND}

# Build and push backend
echo -e "${GREEN}Building backend Docker image...${NC}"
cd ../../server
docker build -f Dockerfile.prod -t ${ECR_BACKEND}:latest .
echo -e "${GREEN}Pushing backend image...${NC}"
docker push ${ECR_BACKEND}:latest

# Build and push frontend
echo -e "${GREEN}Building frontend Docker image...${NC}"
cd ..
docker build -f Dockerfile.prod -t ${ECR_FRONTEND}:latest .
echo -e "${GREEN}Pushing frontend image...${NC}"
docker push ${ECR_FRONTEND}:latest

# Apply Terraform to deploy infrastructure
echo -e "${GREEN}Deploying infrastructure with Terraform...${NC}"
cd infra/terraform
terraform apply

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}Application URL: $(terraform output -raw alb_url)${NC}"

