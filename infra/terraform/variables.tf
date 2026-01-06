variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

variable "app_name" {
  type        = string
  description = "Application name"
  default     = "fortivo"
}

variable "cors_origin" {
  type        = string
  description = "CORS origin for API"
  default     = "*"
}

variable "db_name" {
  type        = string
  description = "Database name"
  default     = "fortivo"
}

variable "db_username" {
  type        = string
  description = "Database username"
  default     = "fortivo_admin"
}

variable "db_password" {
  type        = string
  description = "Database password"
  sensitive   = true
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class"
  default     = "db.t3.micro"
}

variable "jwt_secret" {
  type        = string
  description = "JWT secret key"
  sensitive   = true
}

variable "server_cpu" {
  type        = number
  description = "Server container CPU units (256 = 0.25 vCPU)"
  default     = 256
}

variable "server_memory" {
  type        = number
  description = "Server container memory in MB"
  default     = 512
}

variable "frontend_cpu" {
  type        = number
  description = "Frontend container CPU units (256 = 0.25 vCPU)"
  default     = 256
}

variable "frontend_memory" {
  type        = number
  description = "Frontend container memory in MB"
  default     = 512
}

variable "server_desired_count" {
  type        = number
  description = "Desired number of server tasks"
  default     = 1
}

variable "frontend_desired_count" {
  type        = number
  description = "Desired number of frontend tasks"
  default     = 1
}

variable "bedrock_agent_id" {
  type        = string
  description = "Bedrock Agent ID (optional - leave empty to use standard Bedrock API)"
  default     = ""
}

variable "bedrock_agent_alias_id" {
  type        = string
  description = "Bedrock Agent Alias ID (optional - leave empty to use standard Bedrock API)"
  default     = ""
}


