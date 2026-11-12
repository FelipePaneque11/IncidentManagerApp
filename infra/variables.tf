variable "aws_region" {
  description = "AWS region used by the Incident Manager deployment."
  type        = string
  default     = "us-east-1"
}

variable "db_instance_class" {
  description = "Size of the RDS PostgreSQL instance."
  type        = string
  default     = "db.t3.micro"
}

variable "db_password" {
  description = "Password for the RDS database administrator."
  type        = string
  sensitive   = true
  ephemeral   = true
}