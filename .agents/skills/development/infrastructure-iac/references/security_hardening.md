# IaC Security Hardening Reference

## Least-Privilege IAM Patterns

### Anti-Pattern: Wildcard Actions
```hcl
# NEVER DO THIS
resource "aws_iam_policy" "bad" {
  policy = jsonencode({
    Statement = [{
      Effect   = "Allow"
      Action   = "*"
      Resource = "*"
    }]
  })
}
```

### Correct: Scoped Policy
```hcl
resource "aws_iam_policy" "api_server" {
  policy = jsonencode({
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = aws_secretsmanager_secret.db_password.arn
      }
    ]
  })
}
```

## Encryption at Rest

| Resource | Encryption Setting |
|----------|-------------------|
| S3 Bucket | `server_side_encryption_configuration` with `aws:kms` |
| RDS | `storage_encrypted = true`, `kms_key_id` |
| EBS Volume | `encrypted = true` |
| DynamoDB | `server_side_encryption { enabled = true }` |
| SQS Queue | `kms_master_key_id` |

## Encryption in Transit

```hcl
# RDS: Force SSL
resource "aws_db_parameter_group" "force_ssl" {
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

# S3: Deny non-HTTPS
resource "aws_s3_bucket_policy" "require_tls" {
  policy = jsonencode({
    Statement = [{
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = ["${aws_s3_bucket.main.arn}", "${aws_s3_bucket.main.arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })
}
```

## VPC Design: 3-Tier Architecture

```
Internet Gateway
      │
Public Subnets (10.0.0.0/24, 10.0.1.0/24)
  ├── Load Balancer
  └── NAT Gateway
      │
Private Subnets (10.0.10.0/24, 10.0.11.0/24)
  └── Application Servers (EC2, ECS, Lambda)
      │
Data Subnets (10.0.20.0/24, 10.0.21.0/24)
  └── RDS, ElastiCache (no internet route)
```

Security group rules:
- LB: inbound 443 from 0.0.0.0/0
- App servers: inbound only from LB security group
- Database: inbound only from App server security group

## Secrets Management

### Never in .tfvars or state
```hcl
# BAD: Secret in variable default
variable "db_password" {
  default = "supersecret123"
}

# GOOD: Fetch from Secrets Manager at runtime
data "aws_secretsmanager_secret_version" "db" {
  secret_id = "prod/api/db-password"
}

locals {
  db_password = jsondecode(data.aws_secretsmanager_secret_version.db.secret_string)["password"]
}
```

### Vault Provider
```hcl
provider "vault" {
  address = "https://vault.company.internal"
}

data "vault_generic_secret" "db" {
  path = "secret/prod/database"
}
```

## IMDSv2 Enforcement (EC2)

```hcl
resource "aws_instance" "api" {
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 only
    http_put_response_hop_limit = 1           # Prevent SSRF via containers
  }
}
```

## S3 Public Access Block (Always Enable)

```hcl
resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```
