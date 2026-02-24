# AgentSkills V2

![CLI](https://img.shields.io/badge/CLI-Node.js_20%2B-2f6feb)
![Architecture](https://img.shields.io/badge/Architecture-Multi--Agent-1f883d)
![Install](https://img.shields.io/badge/Install-Agent_or_Domain-8250df)
![Workflows](https://img.shields.io/badge/Workflows-5_ready-f0883e)

AgentSkills; Cursor, Copilot, Claude, Gemini ve diğer AI coding asistanları için çok ajanlı (`agents`) ve yetenek tabanlı (`skills`) bir çalışma katmanı sağlar.  
Bu yapı ile asistanı tek bir genel bot yerine, görev bazlı uzman rollere dönüştürür.

## İçindekiler
- [Hızlı Başlangıç (2 Dakika)](#hızlı-başlangıç-2-dakika)
- [Kurulum Sonrası Kullanım (Direkt Prompt)](#kurulum-sonrası-kullanım-direkt-prompt)
- [Temel Kavramlar](#temel-kavramlar)
- [CLI Komut Rehberi](#cli-komut-rehberi)
- [AI Platform Matrisi](#ai-platform-matrisi)
- [Domain Paketleri](#domain-paketleri)
- [Agent Kataloğu (8/8)](#agent-kataloğu-88)
- [Skill Kataloğu (8/8)](#skill-kataloğu-88)
- [Workflow Rehberi (5/5)](#workflow-rehberi-55)
- [Kurulum Sonrası Dosya Yapısı](#kurulum-sonrası-dosya-yapısı)
- [Sık Sorunlar ve Çözüm](#sık-sorunlar-ve-çözüm)
- [Katkı](#katkı)

## Hızlı Başlangıç (2 Dakika)
```bash
# 1) CLI kur
npm install -g @cagriemiracikkapi-projects/agentskills-cli

# 2) Tek bir agent kur
agentskills init --agent senior-backend --ai cursor

# 3) Veya bir domain paketi kur
agentskills init --domain game --ai copilot

# 4) Veya interaktif sihirbaz
agentskills init
```

Notlar:
- `--agent` ve `--domain` aynı komutta birlikte kullanılmaz.
- `--ai all` kısa yolu sadece `cursor`, `claude`, `copilot` için kurulum yapar.

## Kurulum Sonrası Kullanım (Direkt Prompt)

Kısa cevap: Evet, kurulumdan sonra çoğu durumda direkt prompt yazmanız yeterlidir.

Doğru akış:
1. Proje kökünde AgentSkills kurulum komutunu çalıştırın.
2. AI asistanının okuduğu hedef klasörün oluştuğunu doğrulayın (`.cursor/rules`, `.claude`, `.github`).
3. IDE/AI chat panelini yeniden başlatın veya yeni sohbet açın.
4. İsteğinizi direkt yazın.

Harita mühendisliği için modern web sitesi örneği:

```bash
# Tasarım + frontend odaklı domain kurulumu
agentskills init --domain frontend --ai cursor
```

Sonra AI chat'e direkt yazabilirsiniz:

```text
Harita mühendisligi firmasi icin modern, mobil uyumlu bir websitesi tasarimi olustur.
Ana sayfa, hizmetler, projeler, iletisim ve teklif formu bolumleri olsun.
Renk paleti kurumsal ve guven veren tonda olsun.
```

Daha güçlü sonuç için önerilen prompt:

```text
Harita muhendisligi firmasi icin modern bir web sitesi tasarla.
Tech stack: Next.js + Tailwind.
Sayfalar: Ana Sayfa, Hizmetler, Projeler, Hakkimizda, Iletisim.
Cikti: once bilgi mimarisi, sonra wireframe mantigi, sonra component listesi, sonra ornek kod.
```

Ne zaman tekrar `init` gerekir:
- Farklı bir AI platformuna geçiyorsanız (`cursor` -> `claude` gibi).
- Farklı domain/agent seti yüklemek istiyorsanız.
- Global rules, workflows veya agent içeriklerini güncel sürümden yeniden çekmek istiyorsanız.

## Kurulum Kanalları

### 1) NPM (önerilen)
```bash
npm install -g @cagriemiracikkapi-projects/agentskills-cli
```

### 2) GitHub fallback (NPM yoksa)
```bash
npm install -g git+https://github.com/cagriemiracikkapi-projects/AgentSkills.git#main:cli
```

### 3) Local fallback (en garanti yol)
```bash
git clone https://github.com/cagriemiracikkapi-projects/AgentSkills.git
cd AgentSkills/cli
npm install
npm link
```

```mermaid
flowchart LR
    A[Projede CLI kurulumu] --> B[agentskills init]
    B --> C{Kurulum tipi}
    C -->|--agent| D[Tek persona]
    C -->|--domain| E[Persona paketi]
    C -->|interaktif| F[Sihirbaz seçimi]
    D --> G[Hedef AI klasörü]
    E --> G
    F --> G
```

## Temel Kavramlar
- `Agent`: Uzman rol (ör: `senior-backend`, `qa-automation`).
- `Skill`: Agent’in kullandığı yetenek seti (ör: `api-design`, `qa-testing`).
- `Workflow`: Görev tetikleyici kısayollar (ör: `/audit`, `/test`).
- `Domain`: Birden fazla agent’i birlikte kuran paket (ör: `web`, `game`).

## CLI Komut Rehberi

| Amaç | Komut | Açıklama |
|---|---|---|
| Yardım | `agentskills --help` | Ana komut ve alt komutları gösterir |
| Agent kurulumu | `agentskills init --agent senior-frontend --ai cursor` | Tek uzman rol kurar |
| Domain kurulumu | `agentskills init --domain backend --ai codex` | Domain’e bağlı tüm agent’leri kurar |
| Interaktif kurulum | `agentskills init` | Agent/domain ve AI seçimini sorar |
| Yerelden test | `agentskills init --agent code-auditor --ai cursor --local` | `.agents/` içeriğinden kurar |
| Kaynak repo override | `agentskills init --agent senior-backend --ai cursor --source-repo cagriemiracikkapi-projects/AgentSkills --source-branch main` | Remote içerik kaynağını manuel belirler |

Parametreler:
- `--agent <name>`: Tek persona.
- `--domain <name>`: Çoklu persona paketi.
- `--ai <platform>`: Hedef platform.
- `--local`: Remote yerine yerel `.agents` kaynağı.
- `--source-repo <owner/repo>`: Remote `.agents` kaynağını override eder.
- `--source-branch <branch>`: Remote kaynak branch’ini override eder.

Env alternatifleri:
```bash
# Windows (PowerShell)
$env:AGENTSKILLS_REPO="cagriemiracikkapi-projects/AgentSkills"
$env:AGENTSKILLS_BRANCH="main"
```

## AI Platform Matrisi

| `--ai` | Hedef dizin | Çıktı formatı |
|---|---|---|
| `cursor` | `.cursor/rules` | Agent başına `.mdc` |
| `windsurf` | `.windsurf/rules` | Agent başına `.mdc` |
| `claude` | `.claude` | `agents/` + `skills/` klasör yapısı |
| `kiro` | `.kiro` | `agents/` + `skills/` klasör yapısı |
| `antigravity` | `.gemini/antigravity` | `agents/` + `skills/` klasör yapısı |
| `copilot` | `.github` | Agent başına tek dosya (`*-instructions.md`) |
| `codebuddy` | `.codebuddy` | Agent başına tek dosya (`*-instructions.md`) |
| `gemini` | `.gemini` | Agent başına `.md` |
| `codex` | `.codex` | Agent başına `.md` |
| `qoder` | `.qoder` | Agent başına `.md` |
| `roocode` | `.roocode` | Agent başına `.md` |
| `trae` | `.trae` | Agent başına `.md` |
| `opencode` | `.opencode` | Agent başına `.md` |
| `continue` | `.continue` | Agent başına `.md` |
| `droid` | `.factory` | Agent başına `.md` |
| `all` | kısa yol | Sadece `cursor` + `claude` + `copilot` |

Ek bilgi:
- Script dosyaları, uygun platformlarda `.agent_scripts/` altına çıkarılır.

## Domain Paketleri

| Domain | İçerdiği Agent’ler |
|---|---|
| `backend` | `senior-backend`, `devops-engineer`, `qa-automation`, `code-auditor` |
| `frontend` | `senior-frontend`, `ui-ux-designer`, `qa-automation`, `code-auditor` |
| `game` | `game-architect`, `qa-automation`, `code-auditor` |
| `ai` | `prompt-engineer`, `code-auditor` |
| `web` | `senior-backend`, `senior-frontend`, `devops-engineer`, `qa-automation`, `code-auditor`, `ui-ux-designer` |
| `all` | Tüm desteklenen agent’ler |

## Agent Kataloğu (8/8)

| Agent | Ne zaman kullanılır? | Kurulum komutu | Örnek kullanıcı isteği |
|---|---|---|---|
| `senior-backend` | API, DB, performans, güvenlik | `agentskills init --agent senior-backend --ai cursor` | `10k rps kaldıracak sipariş API mimarisi öner` |
| `senior-frontend` | UI mimarisi, performans, a11y | `agentskills init --agent senior-frontend --ai cursor` | `React dashboard render gecikmesini azalt` |
| `ui-ux-designer` | Tasarım dili, erişilebilirlik, tipografi | `agentskills init --agent ui-ux-designer --ai cursor` | `Bu ekranın görsel hiyerarşisini iyileştir` |
| `game-architect` | Unity/C#, FPS ve GC optimizasyonu | `agentskills init --agent game-architect --ai cursor` | `Update loop GC spike sorununu çöz` |
| `qa-automation` | TDD, unit/integration/E2E test | `agentskills init --agent qa-automation --ai cursor` | `Checkout akışı için flaky olmayan test yaz` |
| `devops-engineer` | CI/CD, Docker, IaC, gözlemlenebilirlik | `agentskills init --agent devops-engineer --ai cursor` | `Main merge sonrası otomatik deploy pipeline kur` |
| `code-auditor` | Salt-okunur güvenlik ve kalite denetimi | `agentskills init --agent code-auditor --ai cursor` | `Bu PR'da OWASP risklerini raporla` |
| `prompt-engineer` | Prompt optimizasyonu, maliyet/kalite dengesi | `agentskills init --agent prompt-engineer --ai cursor` | `Prompt token maliyetini düşür ve formatı sabitle` |

## Skill Kataloğu (8/8)

Skill’ler doğrudan değil, agent bağımlılıkları üzerinden otomatik devreye girer.

| Skill | Kategori | Ne sağlar? | Örnek tetikleme |
|---|---|---|---|
| `development/api-design` | Development | REST/GraphQL yapı, endpoint kontratı | `Yeni users endpoint’i için standard route şablonu kur` |
| `development/code-review` | Development | OWASP odaklı kalite/güvenlik inceleme | `Bu service dosyasında injection riski var mı?` |
| `development/database-optimization` | Development | Yavaş sorgu, index, migration güvenliği | `DB CPU çok yüksek, hangi index eksik?` |
| `development/frontend-performance` | Development | Bundle, render, web vitals optimizasyonu | `LCP 4.2s, hangi adımları uygulamalıyım?` |
| `development/game-performance` | Development | Unity performans/GC/physics analizi | `50 düşman sahnede FPS neden düşüyor?` |
| `development/qa-testing` | Development | TDD ve E2E test yapıları | `Bu modül için AAA düzeninde test üret` |
| `creative-design/ui-design-system` | Creative Design | Tasarım token, component standardı, a11y | `Button/Input için tasarım sistemi temeli çıkar` |
| `ai-engineering/prompt-design` | AI Engineering | Prompt maliyet/kalite ölçümü ve A/B yaklaşımı | `Aynı işi daha az token ile yaptıran prompt öner` |

```mermaid
flowchart TD
    U[User Request] --> A[Agent]
    A --> S1[Skill: references]
    A --> S2[Skill: scripts]
    S1 --> O[Karar ve çıktı]
    S2 --> O
```

## Workflow Rehberi (5/5)

Workflow’lar, kurulumdan sonra AI içinde slash komutları olarak çalışır.

| Workflow | Amaç | Nasıl çağrılır? | Beklenen çıktı |
|---|---|---|---|
| `/audit` | Güvenlik ve kalite denetimi | ` /audit src/auth_service.js ` | Önceliklendirilmiş audit raporu |
| `/test` | Test üretimi ve edge-case kapsamı | ` /test src/checkout.ts ` | Unit/E2E test örnekleri |
| `/commit` | Conventional Commit mesajı üretimi | ` /commit ` | Sadece commit mesajı |
| `/frontend` | UI/UX + performans odaklı geliştirme | ` /frontend src/components/Dashboard.tsx ` | Frontend odaklı öneri/refactor |
| `/manage-roles` | Gereksiz rolleri kapatıp token azaltma | ` /manage-roles ` | Rol optimizasyon özeti |

Örnek workflow akışı:

```mermaid
sequenceDiagram
    participant Dev as Geliştirici
    participant AI as AgentSkills yüklü AI
    Dev->>AI: /audit src/payment.ts
    AI->>AI: code-auditor + code-review skill
    AI-->>Dev: Risk seviyesine göre audit raporu
```

## Kurulum Sonrası Dosya Yapısı

Örnek (`--agent senior-backend --ai cursor`):
```text
.cursor/
  rules/
    senior-backend.mdc
.agent_scripts/
  development_api-design/
  development_database-optimization/
  development_code-review/
```

Örnek (`--agent senior-backend --ai claude`):
```text
.claude/
  agents/
    senior-backend.md
  skills/
    development/
      api-design/
      database-optimization/
      code-review/
```

Örnek (`--agent senior-backend --ai copilot`):
```text
.github/
  senior-backend-instructions.md
```

## Sık Sorunlar ve Çözüm

1. `Use either --agent or --domain, not both`
- Neden: Aynı komutta ikisi birlikte desteklenmez.
- Çözüm: Sadece birini kullanın.

2. `npm ERR! 404 ... agentskills-cli`
- Neden: Eski paket adı (`agentskills-cli`) npm üzerinde yok.
- Çözüm: Scoped paket kullanın:
  - `npm install -g @cagriemiracikkapi-projects/agentskills-cli`
  - veya GitHub fallback komutunu çalıştırın.

3. `Unsupported AI assistant`
- Neden: `--ai` değeri desteklenmiyor.
- Çözüm: `agentskills init --help` ile geçerli listeyi kullanın.

4. Bazı dosyalar oluşmadı
- Neden: Yanlış dizinde komut çalıştırılmış olabilir.
- Çözüm: Proje kökünde tekrar çalıştırın ve hedef klasörü kontrol edin (`.cursor`, `.claude`, `.github` vb.).

5. Workflow çalışmıyor
- Neden: Agent kurulmamış veya yanlış platform klasörüne kurulmuş olabilir.
- Çözüm: İlgili agent’i doğru `--ai` hedefiyle yeniden kurun.

6. `Kurulum yaptım ama direkt prompt etkisiz görünüyor`
- Neden: AI paneli eski oturumdan kuralları cache'lemiş olabilir.
- Çözüm: Yeni chat açın veya IDE/AI panelini yeniden başlatın. Gerekirse `agentskills init ...` komutunu proje kökünde tekrar çalıştırın.

## Katkı
- Yeni agent eklemek için: `.agents/agents/`
- Yeni skill eklemek için: `.agents/skills/<kategori>/<skill-adı>/`
- Workflow eklemek için: `.agents/workflows/`
- İçerik doğrulama:
```bash
cd cli
npm run validate:content
```

Bu komut, `SKILL.md` içindeki script/reference referanslarını ve agent-skill bağlarını doğrular.
