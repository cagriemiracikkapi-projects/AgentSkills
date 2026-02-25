---
name: development/infrastructure-iac
description: Complete toolkit for Infrastructure as Code with Terraform. Covers module composition, remote state management, security scanning, drift detection, and cost estimation. Use when provisioning cloud infrastructure, reviewing Terraform modules, or establishing IaC security gates in CI/CD pipelines.
---

# Skill: Infrastructure as Code (Terraform)

Comprehensive guidelines and tools for authoring, securing, and maintaining production-grade Terraform infrastructure.

## Quick Start

> **Script Paths:** Gemini/Codex/cursorlike: `.agent_scripts/development_infrastructure-iac/`. Claude (folder mode): `.claude/skills/development/infrastructure-iac/scripts/`.

### Main Capabilities

This skill provides two core capabilities through automated scripts:

```bash
# Script 1: IaC Linter (checkov + tflint wrapper)
python .agent_scripts/development_infrastructure-iac/iac_lint.py [options]

# Script 2: Drift Detector
python .agent_scripts/development_infrastructure-iac/drift_detector.py [options]
```

## Core Capabilities

### 1. IaC Linter

Runs `checkov` and `tflint` against a Terraform directory and outputs a unified severity-ranked report.

**Features:**
- Checkov: CIS benchmark compliance, hardcoded secrets detection, insecure resource configs
- tflint: Deprecated argument warnings, provider version pinning, variable type enforcement
- Exits non-zero on Critical findings (suitable as a CI gate)

**Usage:**
```bash
python .agent_scripts/development_infrastructure-iac/iac_lint.py ./infra/ --fail-on critical,high
```

### 2. Drift Detector

Compares `terraform plan` JSON output against the last known state to surface unexpected real-world changes.

**Features:**
- Parses `terraform plan -out=plan.tfplan && terraform show -json plan.tfplan`
- Classifies drifts: Added | Changed | Destroyed
- Outputs actionable remediation steps for each drift

**Usage:**
```bash
python .agent_scripts/development_infrastructure-iac/drift_detector.py --plan-json plan.json --baseline baseline.json
```

## Terraform Module Composition

### Root vs Child Modules
- **Root module:** Entry point (`main.tf`, `variables.tf`, `outputs.tf`). Calls child modules, manages providers.
- **Child modules:** Self-contained, reusable units. Accept variables, output values only. No provider blocks.
- Never hardcode environment-specific values in child modules — pass via `var.*`.

### Remote State
```hcl
terraform {
  backend "s3" {
    bucket         = "company-tfstate"
    key            = "prod/api/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"  # DynamoDB locking prevents concurrent apply
    encrypt        = true
  }
}
```
- One state file per environment per service (e.g., `prod/api/`, `staging/api/`)
- Use `terraform_remote_state` data source to share outputs between root modules (never hardcode cross-module IDs)

### DynamoDB State Locking
- Table: `LockID` (String, partition key)
- Prevents concurrent `terraform apply` corrupting state
- Always enable in CI/CD pipelines

## Security Scanning Integration

### CI Gate Order (Fail Fast)
```
tflint → checkov → terraform validate → terraform plan → infracost → terraform apply
```

### checkov Key Rules
| Check ID | Description | Severity |
|----------|-------------|----------|
| CKV_AWS_18 | S3 access logging enabled | High |
| CKV_AWS_21 | S3 versioning enabled | Medium |
| CKV_AWS_57 | S3 block public access | Critical |
| CKV_AWS_8 | EC2 IMDSv2 required | High |
| CKV_AWS_79 | IMDSv2 hop limit = 1 | High |

### tfsec (supplemental)
```bash
tfsec ./infra/ --format json --out tfsec_report.json
```

## Drift Detection Workflow

1. Schedule `terraform plan` as a daily cron job in CI
2. Parse plan output with `drift_detector.py`
3. Alert on any `Destroyed` or unplanned `Changed` resources
4. Remediate: either update Terraform to match reality, or revert the manual change

## Cost Estimation (infracost)

```bash
infracost breakdown --path ./infra/ --format json --out-file infracost.json
infracost diff --path ./infra/ --compare-to infracost-main.json
```
- Run on every PR to surface cost delta before merge
- Alert if monthly delta > $500 (configurable threshold)

## Reference Documentation

### Terraform Patterns
Comprehensive guide available in `references/terraform_patterns.md`:
- Module versioning and registry publishing
- Workspace vs separate state files for environments
- `for_each` vs `count` (prefer `for_each` for named resources)
- `moved` block for safe resource renaming without destroy/recreate

### Security Hardening
Technical reference in `references/security_hardening.md`:
- Least-privilege IAM policy patterns
- Encryption at rest and in transit requirements by resource type
- VPC design: public/private/data subnet tiers
- Secrets: never in `.tfvars` files; use AWS Secrets Manager / Vault provider

## Tech Stack

**IaC:** Terraform >= 1.5, OpenTofu
**Providers:** AWS, GCP, Azure, Kubernetes
**Security:** checkov, tflint, tfsec, trivy
**Cost:** infracost
**State:** S3 + DynamoDB, GCS, Azure Blob

## Development Workflow

### 1. Module Design
- Define input variables with types and descriptions
- Define outputs for every value consumers may need
- Pin provider versions in root module (`~> 5.0`)

### 2. Lint & Scan
```bash
python .agent_scripts/development_infrastructure-iac/iac_lint.py ./infra/
```

### 3. Plan & Review
- Review `terraform plan` for unexpected destroys before apply
- Run `drift_detector.py` weekly to catch manual console changes

### 4. Cost Check
```bash
infracost diff --path ./infra/
```

## Best Practices Summary

### Naming Conventions
- Resources: `<env>-<service>-<resource-type>` (e.g., `prod-api-sg`)
- State keys: `<env>/<service>/terraform.tfstate`
- Tag every resource: `Environment`, `Service`, `Owner`, `CostCenter`

### Immutability Rules
- Never `terraform apply` directly on prod without a PR-reviewed plan artifact
- Use `terraform plan -out=plan.tfplan` in CI; apply the saved plan artifact only
- Treat `terraform destroy` as a last resort; prefer `lifecycle { prevent_destroy = true }` on stateful resources

## Resources

- Terraform Patterns: `references/terraform_patterns.md`
- Security Hardening: `references/security_hardening.md`
- Utilities: `.agent_scripts/development_infrastructure-iac/` directory
