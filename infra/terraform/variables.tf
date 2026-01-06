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


