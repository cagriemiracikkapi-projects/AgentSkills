# Terraform Patterns Reference

## Module Versioning

### Registry Modules
```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"  # Pin minor version; allow patches
}
```

### Local Modules
```hcl
module "api_server" {
  source = "./modules/api-server"
  # No version pin needed for local modules
}
```

### Git Source Modules
```hcl
module "shared_networking" {
  source = "git::https://github.com/company/tf-modules.git//networking?ref=v2.1.0"
}
```

## Workspace vs Separate State Files

| Approach | Use When | Avoid When |
|----------|----------|------------|
| `terraform workspace` | Simple env differences (same infra, different values) | Different infra per env (e.g., prod has RDS Multi-AZ, dev doesn't) |
| Separate state files | Different infra topology per env | You want a single working directory for all envs |

**Recommendation:** Separate state files per env for production systems. Workspaces are convenient but obscure env differences.

## `for_each` vs `count`

**Prefer `for_each` for named resources:**
```hcl
# GOOD: Resource addresses are stable even if set changes
resource "aws_iam_user" "devs" {
  for_each = toset(["alice", "bob", "carol"])
  name     = each.key
}

# BAD: Removing index 0 destroys and recreates all subsequent users
resource "aws_iam_user" "devs" {
  count = length(var.dev_names)
  name  = var.dev_names[count.index]
}
```

Use `count` only for boolean resource creation: `count = var.enable_feature ? 1 : 0`

## `moved` Block (Safe Renaming)

Rename a resource without destroy/recreate:
```hcl
moved {
  from = aws_instance.web
  to   = aws_instance.api_server
}
```

Also works for module refactoring:
```hcl
moved {
  from = module.old_name
  to   = module.new_name
}
```

## Variable Type Enforcement

```hcl
variable "instance_type" {
  type        = string
  description = "EC2 instance type"
  default     = "t3.medium"

  validation {
    condition     = contains(["t3.medium", "t3.large", "m5.large"], var.instance_type)
    error_message = "instance_type must be one of: t3.medium, t3.large, m5.large"
  }
}
```

## Output Conventions

```hcl
output "database_endpoint" {
  description = "RDS instance endpoint for application connection"
  value       = aws_db_instance.main.endpoint
  sensitive   = false  # Endpoint is not a secret; connection string is
}

output "database_password" {
  description = "RDS master password (sensitive)"
  value       = random_password.db.result
  sensitive   = true  # Prevents output in logs
}
```

## Lifecycle Rules

```hcl
resource "aws_db_instance" "main" {
  # ...
  lifecycle {
    prevent_destroy       = true   # Block accidental destroy
    create_before_destroy = true   # Zero-downtime replacement
    ignore_changes        = [password]  # Don't drift on externally rotated secrets
  }
}
```
