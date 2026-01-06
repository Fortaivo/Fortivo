output "alb_dns_name" {
  value       = aws_lb.this.dns_name
  description = "Application Load Balancer DNS name"
}

output "alb_url" {
  value       = "http://${aws_lb.this.dns_name}"
  description = "Full URL to access the application"
}

output "ecr_backend_repository_url" {
  value       = module.ecr_backend.repository_url
  description = "ECR repository URL for backend"
}

output "ecr_frontend_repository_url" {
  value       = module.ecr_frontend.repository_url
  description = "ECR repository URL for frontend"
}

output "rds_endpoint" {
  value       = aws_db_instance.this.endpoint
  description = "RDS database endpoint"
  sensitive   = true
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.uploads.id
  description = "S3 bucket name for uploads"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.this.name
  description = "ECS cluster name"
}


