# Reuse the subnets we looked up in main.tf.
resource "aws_db_subnet_group" "incident" {
  name       = "incident-manager-db"
  subnet_ids = data.aws_subnets.default.ids
}

# Elastic Beanstalk's app server will use this group in a later step.
resource "aws_security_group" "app" {
  name        = "incident-manager-app"
  description = "Security group for the Incident Manager app server"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_security_group" "database" {
  name        = "incident-manager-db"
  description = "Security group for the Incident Manager database"
  vpc_id      = data.aws_vpc.default.id
}

# Allow PostgreSQL traffic from servers in the app security group.
resource "aws_vpc_security_group_ingress_rule" "postgres_from_app" {
  security_group_id            = aws_security_group.database.id
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_db_instance" "incident" {
  identifier        = "incident-manager-db"
  engine            = "postgres"
  engine_version    = "17"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp2"
  storage_encrypted = true

  db_name             = "incident_manager"
  username            = "incidentadmin"
  password_wo         = var.db_password
  password_wo_version = 1

  db_subnet_group_name   = aws_db_subnet_group.incident.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false
  multi_az               = false

  # The AWS Academy lab does not support Enhanced Monitoring.
  monitoring_interval       = 0
  backup_retention_period   = 1
  skip_final_snapshot       = false
  final_snapshot_identifier = "incident-manager-db-final"
}

output "db_host" {
  description = "Private PostgreSQL hostname for the backend."
  value       = aws_db_instance.incident.address
}
