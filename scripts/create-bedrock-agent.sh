#!/bin/bash
# Script to create a Bedrock Agent for Fortivo AI Assistant
# This creates the agent via AWS CLI since Terraform doesn't fully support Bedrock Agents yet

set -e

REGION="${AWS_REGION:-us-east-1}"
AGENT_NAME="fortivo-assistant"
FOUNDATION_MODEL="anthropic.claude-3-5-sonnet-20241022-v2:0"

echo "🤖 Creating Bedrock Agent: $AGENT_NAME"

# Create IAM role for the agent (if it doesn't exist)
ROLE_NAME="fortivo-bedrock-agent-role"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "📋 Creating IAM role for Bedrock Agent..."

# Check if role exists
if ! aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null; then
  # Create trust policy
  cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  # Create the role
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document file:///tmp/trust-policy.json

  # Attach policy for Bedrock model access
  cat > /tmp/bedrock-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:${REGION}::foundation-model/${FOUNDATION_MODEL}"
      ]
    }
  ]
}
EOF

  aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "bedrock-model-access" \
    --policy-document file:///tmp/bedrock-policy.json

  echo "✅ IAM role created"
else
  echo "✅ IAM role already exists"
fi

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# Create the agent
echo "🤖 Creating Bedrock Agent..."

AGENT_INSTRUCTION="You are the official Fortivo AI Assistant, designed to help users manage their wealth and legacy with confidence. You provide expert guidance on asset management, beneficiary planning, portfolio analytics, and security best practices. Always be professional, clear, and empathetic."

AGENT_ID=$(aws bedrock-agent create-agent \
  --agent-name "$AGENT_NAME" \
  --agent-resource-role-arn "$ROLE_ARN" \
  --foundation-model "$FOUNDATION_MODEL" \
  --instruction "$AGENT_INSTRUCTION" \
  --description "Fortivo AI Assistant powered by Claude Sonnet 4.5" \
  --idle-session-ttl-in-seconds 1800 \
  --region "$REGION" \
  --query 'agent.agentId' \
  --output text)

echo "✅ Agent created with ID: $AGENT_ID"

# Prepare the agent (required before creating alias)
echo "📦 Preparing agent..."
aws bedrock-agent prepare-agent \
  --agent-id "$AGENT_ID" \
  --region "$REGION"

echo "⏳ Waiting for agent to be ready..."
aws bedrock-agent wait agent-prepared \
  --agent-id "$AGENT_ID" \
  --region "$REGION" || true

# Create agent alias
echo "🏷️  Creating agent alias..."
ALIAS_ID=$(aws bedrock-agent create-agent-alias \
  --agent-id "$AGENT_ID" \
  --agent-alias-name "fortivo-assistant-alias" \
  --description "Production alias for Fortivo AI Assistant" \
  --region "$REGION" \
  --query 'agentAlias.agentAliasId' \
  --output text)

echo "✅ Agent alias created with ID: $ALIAS_ID"

echo ""
echo "🎉 Bedrock Agent setup complete!"
echo ""
echo "Add these to your terraform.tfvars:"
echo "  bedrock_agent_id = \"$AGENT_ID\""
echo "  bedrock_agent_alias_id = \"$ALIAS_ID\""
echo ""
echo "Then run: terraform apply"

