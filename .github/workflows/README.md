# GitHub Actions CI/CD Workflows

This repository includes automated CI/CD pipelines for testing, building, and deploying the Fortivo application to AWS.

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

Runs on every push to `main` and on pull requests.

**Jobs:**
- **Test**: Runs frontend and backend tests
- **Terraform Validate**: Validates Terraform configuration
- **Build and Deploy**: (Only on `main` branch)
  - Builds Docker images for frontend and backend
  - Pushes images to ECR
  - Deploys to ECS Fargate
  - Waits for services to stabilize

### 2. Terraform Plan (`terraform-plan.yml`)

Runs on pull requests that modify Terraform files.

**Features:**
- Validates Terraform configuration
- Runs `terraform plan` to show infrastructure changes
- Comments on the PR with the plan output

## Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **AWS_ACCESS_KEY_ID**: AWS access key with permissions for ECR, ECS, and Terraform resources
2. **AWS_SECRET_ACCESS_KEY**: AWS secret access key
3. **TF_VAR_DB_PASSWORD**: Database password (for Terraform)
4. **TF_VAR_JWT_SECRET**: JWT secret key (for Terraform)

## Setup Instructions

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the required secrets listed above
4. The workflows will automatically run on push/PR

## Workflow Triggers

- **Push to main**: Runs tests, validates Terraform, builds and deploys
- **Pull Request**: Runs tests and validates Terraform (no deployment)
- **Terraform changes in PR**: Shows Terraform plan in PR comments

## Manual Workflow Dispatch

You can also trigger workflows manually from the Actions tab if needed.

