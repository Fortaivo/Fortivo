# PowerShell script to create a Bedrock Agent for Fortivo AI Assistant
# This creates the agent via AWS CLI since Terraform doesn't fully support Bedrock Agents yet

$ErrorActionPreference = "Stop"

$REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$AGENT_NAME = "fortivo-assistant"
$FOUNDATION_MODEL = "anthropic.claude-3-5-sonnet-20241022-v2:0"

Write-Host "🤖 Creating Bedrock Agent: $AGENT_NAME" -ForegroundColor Cyan

# Get AWS Account ID
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text).Trim()

# Create IAM role for the agent
$ROLE_NAME = "fortivo-bedrock-agent-role"
$ROLE_ARN = "arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

Write-Host "📋 Checking IAM role for Bedrock Agent..." -ForegroundColor Yellow

# Check if role exists
$roleExists = aws iam get-role --role-name $ROLE_NAME 2>$null
if (-not $roleExists) {
    Write-Host "Creating IAM role..." -ForegroundColor Yellow
    
    # Create trust policy
    $trustPolicy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Principal = @{
                    Service = "bedrock.amazonaws.com"
                }
                Action = "sts:AssumeRole"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $trustPolicy | Out-File -FilePath "$env:TEMP\trust-policy.json" -Encoding utf8
    
    # Create the role
    aws iam create-role `
        --role-name $ROLE_NAME `
        --assume-role-policy-document "file://$env:TEMP\trust-policy.json"
    
    # Create policy for Bedrock model access
    $bedrockPolicy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Action = @("bedrock:InvokeModel")
                Resource = @("arn:aws:bedrock:${REGION}::foundation-model/${FOUNDATION_MODEL}")
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $bedrockPolicy | Out-File -FilePath "$env:TEMP\bedrock-policy.json" -Encoding utf8
    
    aws iam put-role-policy `
        --role-name $ROLE_NAME `
        --policy-name "bedrock-model-access" `
        --policy-document "file://$env:TEMP\bedrock-policy.json"
    
    Write-Host "✅ IAM role created" -ForegroundColor Green
} else {
    Write-Host "✅ IAM role already exists" -ForegroundColor Green
}

# Create the agent
Write-Host "🤖 Creating Bedrock Agent..." -ForegroundColor Yellow

$AGENT_INSTRUCTION = "You are the official Fortivo AI Assistant, designed to help users manage their wealth and legacy with confidence. You provide expert guidance on asset management, beneficiary planning, portfolio analytics, and security best practices. Always be professional, clear, and empathetic."

$agentResponse = aws bedrock-agent create-agent `
    --agent-name $AGENT_NAME `
    --agent-resource-role-arn $ROLE_ARN `
    --foundation-model $FOUNDATION_MODEL `
    --instruction $AGENT_INSTRUCTION `
    --description "Fortivo AI Assistant powered by Claude Sonnet 4.5" `
    --idle-session-ttl-in-seconds 1800 `
    --region $REGION `
    --output json | ConvertFrom-Json

$AGENT_ID = $agentResponse.agent.agentId

Write-Host "✅ Agent created with ID: $AGENT_ID" -ForegroundColor Green

# Prepare the agent (required before creating alias)
Write-Host "📦 Preparing agent..." -ForegroundColor Yellow
aws bedrock-agent prepare-agent --agent-id $AGENT_ID --region $REGION

Write-Host "⏳ Waiting for agent to be ready (this may take a few minutes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Create agent alias
Write-Host "🏷️  Creating agent alias..." -ForegroundColor Yellow
$aliasResponse = aws bedrock-agent create-agent-alias `
    --agent-id $AGENT_ID `
    --agent-alias-name "fortivo-assistant-alias" `
    --description "Production alias for Fortivo AI Assistant" `
    --region $REGION `
    --output json | ConvertFrom-Json

$ALIAS_ID = $aliasResponse.agentAlias.agentAliasId

Write-Host "✅ Agent alias created with ID: $ALIAS_ID" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Bedrock Agent setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Add these to your terraform.tfvars:" -ForegroundColor Cyan
Write-Host "  bedrock_agent_id = `"$AGENT_ID`"" -ForegroundColor White
Write-Host "  bedrock_agent_alias_id = `"$ALIAS_ID`"" -ForegroundColor White
Write-Host ""
Write-Host "Then run: terraform apply" -ForegroundColor Yellow

