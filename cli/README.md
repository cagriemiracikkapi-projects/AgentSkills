# AgentSkills

> Cursor, Claude, Gemini, Codex ve diğer AI asistanlar için çok ajanlı, yetenek tabanlı uzmanlaşma katmanı

![CLI](https://img.shields.io/badge/CLI-Node.js_20%2B-2f6feb)
![Agents](https://img.shields.io/badge/Agents-12-1f883d)
![Skills](https://img.shields.io/badge/Skills-11-8250df)
![Workflows](https://img.shields.io/badge/Workflows-10-f0883e)
![Platforms](https://img.shields.io/badge/Platforms-15%2B-0ea5e9)

---

## İçindekiler

- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Platform Destek Matrisi](#platform-destek-matrisi)
- [Agents Kataloğu (12)](#agents-kataloğu-12)
- [Skills Kataloğu (11 paket)](#skills-kataloğu-11-paket)
- [Workflows Referansı (10)](#workflows-referansı-10)
- [Platform-Specific Notlar](#platform-specific-notlar)
- [Kurulum Rehberi](#kurulum-rehberi)
- [Dosya Yapısı](#dosya-yapısı)
- [Sorun Giderme](#sorun-giderme)

---

## Hızlı Başlangıç

```bash
# 1) CLI'ı global kur
npm install -g @cagriemiracikkapi-projects/agentskills-cli

# 2) Tek agent kur (tercih edilen yol)
agentskills init --agent senior-backend --ai claude

# 3) Ya da bir domain paketi kur (birden fazla agent birden)
agentskills init --domain game --ai cursor

# 4) Interaktif sihirbaz (ne seçeceğini bilmiyorsan)
agentskills init
```

**Kurulumdan sonra:** AI chat'ini yeniden başlat ve direkt prompt yaz — kurallar otomatik inject edilir.

---

## Platform Destek Matrisi

| `--ai` değeri | Canonical klasör | Compat export |
|---|---|---|
| `claude` | `.claude/agents/`, `.claude/skills/`, `.claude/commands/` | `.agents/workflows/*.md` |
| `cursor` | `.cursor/rules/*.mdc`, `.cursor/commands/*.md` | `.agents/workflows/*.md` |
| `windsurf` | `.windsurf/rules/*.mdc`, `.windsurf/commands/*.md` | `.agents/workflows/*.md` |
| `gemini` | `.gemini/*.md`, `.gemini/commands/*.md` | `.agents/workflows/*.md` |
| `codex` | `.codex/*.md`, `AGENTS.md` managed block | `.agents/workflows/*.md` |
| `copilot` | `.github/*-instructions.md` | `.agents/workflows/*.md` |
| `kiro` | `.kiro/agents/`, `.kiro/skills/`, `.kiro/commands/` | `.agents/workflows/*.md` |
| `antigravity` | `.gemini/antigravity/{agents,skills,commands}/` | `.gemini/commands/` |
| `codebuddy` | `.codebuddy/*-instructions.md` | `.agents/workflows/*.md` |
| `qoder` | `.qoder/*.md` | `.agents/workflows/*.md` |
| `roocode` | `.roocode/*.md` | `.agents/workflows/*.md` |
| `trae` | `.trae/*.md` | `.agents/workflows/*.md` |
| `opencode` | `.opencode/*.md` | `.agents/workflows/*.md` |
| `continue` | `.continue/*.md` | `.agents/workflows/*.md` |
| `droid` | `.factory/*.md` | `.agents/workflows/*.md` |
| `all` | Kısayol: cursor + claude + copilot | — |

Script dosyaları tüm platformlarda `.agent_scripts/` altına kurulur.

---

## Agents Kataloğu (12)

### `senior-backend`

**Ne yapar:** Yüksek trafikli API mimarisi, veritabanı tasarımı, güvenlik ve performans optimizasyonu.

**Ne zaman kullan:**
- Yeni REST/GraphQL endpoint tasarlarken
- Veritabanı sorgu performansını artırırken
- Production güvenlik açıklarını kapatırken

**Örnek promptlar:**
```text
10k RPS kaldıracak sipariş API mimarisi öner, rate limiting ve circuit breaker dahil.

Bu PostgreSQL sorgusunu optimize et — 500ms üzerinde çalışıyor.

JWT token rotasyonu için güvenli bir refresh token stratejisi yaz.
```

**Chat davranışı:** Mimari kararları önce açıklar, sonra kod üretir. API contract, hata kodları ve güvenlik notları içerir.

**Skills loaded:** `development/api-design`, `development/database-optimization`, `development/code-review`

---

### `senior-frontend`

**Ne yapar:** React/Vue/Svelte UI mimarisi, web vitals optimizasyonu, erişilebilirlik denetimleri.

**Ne zaman kullan:**
- LCP/FID/CLS skorlarını iyileştirirken
- Component mimarisini planlarken
- Bundle boyutunu küçültürken

**Örnek promptlar:**
```text
Dashboard'umun LCP skoru 4.2s. Neyi optimize etmeliyim?

React state'i re-render'ı minimize edecek şekilde yeniden yap.

Bu bileşen kütüphanesi için erişilebilirlik denetimi yap.
```

**Chat davranışı:** Core Web Vitals metrikleri, before/after karşılaştırmaları ve profiler yorumları üretir.

**Skills loaded:** `creative-design/ui-design-system`, `development/frontend-performance`, `development/code-review`

---

### `ui-ux-designer`

**Ne yapar:** Tasarım sistemi kurulumu, tipografi, renk tokenleri, bileşen standardizasyonu, WCAG uyumu.

**Ne zaman kullan:**
- Sıfırdan bir design system kurarken
- Marka renklerinden token skalası üretirken
- Erişilebilirlik sorunlarını tespit ederken

**Örnek promptlar:**
```text
#3b82f6 ana renk üzerinden Tailwind uyumlu bir token skalası oluştur.

Bu form layoutunun görsel hiyerarşisini iyileştir.

WCAG AA uyumu için bu bileşeni denetle.
```

**Chat davranışı:** Renk tokenleri, CSS custom properties, Storybook story ve WCAG referans açıklamaları üretir.

**Skills loaded:** `creative-design/ui-design-system`, `creative-design/frontend-design`, `development/frontend-performance`

---

### `game-architect`

**Ne yapar:** Unity/C# performans optimizasyonu, GC spike tespiti, fizik API hataları, ECS/DOTS tavsiyeleri.

**Ne zaman kullan:**
- FPS düşüşü veya GC spike sorunlarında
- Physics sistemi yeniden yapılandırırken
- Çok sayıda nesne yönetimi için object pool tasarlarken

**Örnek promptlar:**
```text
50 düşman sahnede FPS 18'e düşüyor. Update loop'u analiz et.

BulletPool için ObjectPool implementasyonu üret, initial size 50, max 500.

Physics.Raycast spam'ı nasıl optimize ederim?
```

**Chat davranışı:** C# kod üretir, Unity Editor menü yollarını belirtir, Profiler marker önerileri ekler.

**Skills loaded:** `development/game-performance`, `development/qa-testing`, `development/game-development`

---

### `mobile-developer`

**Ne yapar:** React Native ve Flutter cross-platform mobil geliştirme, performans ve batarya optimizasyonu.

**Ne zaman kullan:**
- React Native veya Flutter uygulama geliştirirken
- Mobil performans sorunlarını çözerken
- Platform-spesifik (iOS/Android) davranış farklılıklarını yönetirken

**Örnek promptlar:**
```text
React Native FlatList'imde scroll performansı çok kötü. windowSize ve getItemLayout'u ayarla.

Flutter'da Riverpod ile state management kur.

Bu uygulama iOS'ta Android'den %40 daha yavaş, neden olabilir?
```

**Chat davranışı:** Platform farklılıklarını tablo olarak gösterir, performans ölçüm araçlarını belirtir.

**Skills loaded:** `development/frontend-performance`, `development/qa-testing`

---

### `qa-automation`

**Ne yapar:** TDD/BDD test üretimi, E2E Page Object Model oluşturma, flaky test tespiti, test coverage analizi.

**Ne zaman kullan:**
- Yeni modül için test altyapısı kurarken
- Flaky testleri araştırırken
- CI pipeline test süresini azaltırken

**Örnek promptlar:**
```text
UserService için Jest unit test seti üret — tüm hata yollarını kapsa.

Checkout akışı için Cypress Page Object üret, data-testid kullan.

Bu CI loglarındaki flaky testleri tespit et.
```

**Chat davranışı:** Çalıştırılabilir test dosyaları yazar, flaky test açıklamalarını raporlar, kapsama oranını gösterir.

**Skills loaded:** `development/qa-testing`

---

### `devops-engineer`

**Ne yapar:** CI/CD pipeline, Docker/Kubernetes, IaC (Terraform/Pulumi), SRE pratikleri, observability.

**Ne zaman kullan:**
- Sıfırdan bir CI/CD pipeline kurarken
- Kubernetes deployment yapılandırırken
- Altyapı maliyetini optimize ederken

**Örnek promptlar:**
```text
Main branch merge sonrası otomatik staging deployment için GitHub Actions pipeline yaz.

Bu Dockerfile'ı multi-stage build ile küçült.

Prometheus + Grafana ile Node.js servis metriklerini izle.
```

**Chat davranışı:** Tam YAML/HCL dosyaları üretir, gizli değerler için placeholder kullanır, rollback stratejisi ekler.

**Skills loaded:** `development/code-review`, `development/infrastructure-iac`

---

### `fullstack-developer`

**Ne yapar:** Backend + frontend entegrasyonu, full-stack feature geliştirme, API kontrakt tasarımı.

**Ne zaman kullan:**
- Hem backend hem frontend değişimi gerektiren bir özellik geliştirirken
- API-to-UI veri akışını tasarlarken
- Monorepo veya mikro-frontend mimarisi kurarken

**Örnek promptlar:**
```text
Kullanıcı profil düzenleme özelliği — backend API + React UI + validasyon birlikte.

tRPC ile type-safe full-stack kurulum yap.

Bu REST API'yi GraphQL'e migrate et.
```

**Chat davranışı:** Backend ve frontend kodunu ayrı bölümlerde sunar, API kontrakt tanımını öne çıkarır.

**Skills loaded:** `development/api-design`, `development/frontend-performance`, `development/code-review`

---

### `code-auditor`

**Ne yapar:** Salt-okunur güvenlik ve kalite denetimi — OWASP Top 10, cyclomatic complexity, mimari ihlaller.

**Ne zaman kullan:**
- PR merge öncesi güvenlik denetimi için
- Teknik borç raporlamak için
- Yeni bir ekibe katılınca mevcut kodu incelemek için

**Örnek promptlar:**
```text
Bu auth service'te OWASP güvenlik açığı var mı?

Bu modülün cyclomatic complexity raporunu çıkar, threshold 10.

Mimari katman ihlallerini ve circular dependency'leri tespit et.
```

**Chat davranışı:** Önceliklendirilmiş audit raporu (HIGH/MED/LOW) üretir. Kod YAZmaz — yalnızca raporlar.

**Skills loaded:** `development/code-review`, `development/qa-testing`

---

### `database-architect`

**Ne yapar:** Veri modelleme, şema tasarımı, index stratejisi, migration güvenliği, sharding tavsiyeleri.

**Ne zaman kullan:**
- Yeni bir veri modeli tasarlarken
- Yavaş sorguları analiz ederken
- Migration dosyalarını production'a almadan önce doğrularken

**Örnek promptlar:**
```text
E-ticaret platformu için normalized şema tasarla — ürün, sipariş, envanter.

Bu slow query log'undaki N+1 pattern'leri tespit et.

Bu migration dosyası production'da sorun çıkarır mı?
```

**Chat davranışı:** ERD açıklamaları, `CREATE INDEX` SQL çıktıları ve migration risk raporu üretir.

**Skills loaded:** `development/database-optimization`, `development/code-review`

---

### `debugger`

**Ne yapar:** Üretim hatalarını sistematik teşhis etme, kök neden analizi, memory leak ve race condition tespiti.

**Ne zaman kullan:**
- Aralıklı production crash'lerinde
- Memory leak araştırmasında
- Karmaşık async hata ayıklamasında

**Örnek promptlar:**
```text
Node.js servisim 6 saatte bir MemoryError veriyor. Stack trace şu...

Bu race condition neden oluşuyor?

Production log'unda bu 502 hatasının kök nedeni nedir?
```

**Chat davranışı:** Hipotez → kanıt → çözüm formatında yanıt verir. Yeniden üretme adımlarını listeler.

**Skills loaded:** `development/code-review`, `development/qa-testing`

---

### `prompt-engineer`

**Ne yapar:** Production prompt optimizasyonu, token maliyet analizi, few-shot seçimi, A/B değerlendirme, hallucination azaltma.

**Ne zaman kullan:**
- LLM maliyetini azaltmak için
- Prompt çıktı formatını stabilize etmek için
- Yeni bir model için prompt uyarlarken (Claude, Gemini 3.1 Pro, GPT-4o)

**Örnek promptlar:**
```text
Bu müşteri destek prompt'u çok pahalı — aynı kaliteyi daha az token ile üret.

Claude Sonnet 4.6 için JSON çıktısı garanti eden yapısal prompt tasarla.

Gemini 3.1 Pro için bu RAG prompt'unu uyarla — temperature ve constraint kurallarını uygula.
```

**Chat davranışı:** Strateji açıklaması → prompt artifact → edge case mitigations formatında çıktı verir.

**Skills loaded:** `ai-engineering/prompt-design`, `development/qa-testing`

---

## Skills Kataloğu (11 paket)

### `development/api-design`

**Ne sağlar:** REST/GraphQL endpoint kontratları, OpenAPI 3.1.0 spec üretimi, route scaffolding (Express/FastAPI/Gin), gerçek concurrent load testi.

**Hangi agent'lar kullanır:** `senior-backend`, `fullstack-developer`

**Çalıştırılabilir scriptler:**
```bash
# Gerçek concurrent HTTP load testi (asyncio + urllib, stdlib only)
python .agent_scripts/development_api-design/endpoint_load_tester.py https://api.example.com/health \
  --users 20 --duration 30

# Express/FastAPI/Gin route scaffolding (gerçek dosyalar yazar)
python .agent_scripts/development_api-design/api_route_scaffolder.py users \
  --method POST --framework fastapi --out src/

# OpenAPI 3.1.0 spec üretimi (Express + FastAPI + Gin pattern'leri, path parameter desteği)
python .agent_scripts/development_api-design/openapi_generator.py ./src --output openapi.json
```

---

### `development/code-review`

**Ne sağlar:** OWASP statik tarama (7 kural: SQL injection, XSS, command injection, hardcoded secret, eval, IDOR, weak crypto), cyclomatic complexity (Python AST + JS regex), mimari katman ihlalleri, circular dependency tespiti (DFS).

**Hangi agent'lar kullanır:** `code-auditor`, `senior-backend`, `senior-frontend`, `debugger`, `devops-engineer`, `fullstack-developer`

**Çalıştırılabilir scriptler:**
```bash
# OWASP vulnerability scanner (7 kural, gerçek dosya:satır çıktısı)
node .agent_scripts/development_code-review/owasp_scanner.js ./src --json

# Cyclomatic complexity (CC > threshold veya God Method ≥ 60 satır)
python .agent_scripts/development_code-review/complexity_analyzer.py ./src --threshold 10

# Mimari katman ihlalleri + circular dependency (AST tabanlı)
python .agent_scripts/development_code-review/arch_dependency_mapper.py ./src
```

---

### `development/database-optimization`

**Ne sağlar:** SQL sorgu analizi ile index önerisi (equality → range → ORDER BY sıralama kuralı), migration risk doğrulama (6 pattern), slow query N+1 tespiti.

**Hangi agent'lar kullanır:** `senior-backend`, `database-architect`

**Çalıştırılabilir scriptler:**
```bash
# WHERE/JOIN/ORDER BY'dan gerçek CREATE INDEX SQL üretir
python .agent_scripts/development_database-optimization/index_recommender.py \
  --table users \
  --query "SELECT * FROM users WHERE status='active' AND created_at > '2024-01-01' ORDER BY last_login DESC"

# Migration dosyasında DROP/MODIFY/RENAME/ADD DEFAULT risklerini tarar
python .agent_scripts/development_database-optimization/migration_validator.py ./migrations/

# Slow query log analizi, N+1 tespiti (JSON çıktı destekli)
python .agent_scripts/development_database-optimization/slow_query_analyzer.py \
  --log-file postgresql.log --threshold 500 --json
```

---

### `development/frontend-performance`

**Ne sağlar:** Webpack/Vite stats.json parse ederek bundle analizi, kullanılmayan CSS selector tespiti, büyük görsel uyarısı (>200KB), React DevTools profiler JSON yorumu.

**Hangi agent'lar kullanır:** `senior-frontend`, `mobile-developer`, `ui-ux-designer`, `fullstack-developer`

**Çalıştırılabilir scriptler:**
```bash
# Webpack/Vite stats.json parse, ağır bağımlılık tespiti (moment, lodash, antd...)
node .agents/skills/development/frontend-performance/scripts/bundle_analyzer.js --stats dist/stats.json
# Ya da dist klasörünü doğrudan tara:
node .agents/skills/development/frontend-performance/scripts/bundle_analyzer.js --src dist/

# Kullanılmayan CSS selector'ları ve büyük görselleri tespit eder
node .agents/skills/development/frontend-performance/scripts/asset_purger.js --src src/ --css src/styles/

# React DevTools profiler JSON → hot component'ler, re-render nedenleri
node .agents/skills/development/frontend-performance/scripts/react_profiler_parser.js profile.json
```

---

### `development/game-performance`

**Ne sağlar:** Unity C# GC allocation taraması (Update/FixedUpdate içinde string concat, LINQ, array alloc, GetComponent, Instantiate), physics API yanlış kullanım tespiti, Unity ObjectPool scaffolding (IDisposable + interface).

**Hangi agent'lar kullanır:** `game-architect`

**Çalıştırılabilir scriptler:**
```bash
# GC allocation: Update hot path içinde string concat, LINQ, GetComponent tarar
python .agents/skills/development/game-performance/scripts/gc_allocation_scanner.py Assets/

# Physics API: transform.position=, Physics.Raycast, AddForce dışı FixedUpdate tespiti
python .agents/skills/development/game-performance/scripts/physics_profiler_analyzer.py Assets/

# IDisposable + interface pattern ile tam Unity ObjectPool üretir, dosya yazar
python .agents/skills/development/game-performance/scripts/object_pool_scaffolder.py BulletPool \
  --type Bullet --initial-size 50 --max-size 500 --out Assets/Scripts/Pooling
```

---

### `development/game-development`

**Ne sağlar:** 2D/3D Unity oyun mimarisi prensipleri, multiplayer tasarım tavsiyeleri, ECS/DOTS rehberleri, scene management stratejileri.

**Hangi agent'lar kullanır:** `game-architect`

---

### `development/infrastructure-iac`

**Ne sağlar:** Terraform/Pulumi IaC şablonları, Kubernetes manifest örnekleri, CI/CD pipeline tasarımı, SRE prensipleri, observability stack kurulumu.

**Hangi agent'lar kullanır:** `devops-engineer`

---

### `development/qa-testing`

**Ne sağlar:** Jest/Vitest unit test üretimi (TypeScript destekli, gerçek dosya yazar), Cypress/Playwright Page Object Model (data-testid'den otomatik), flaky test log analizi + hardcoded wait tespiti.

**Hangi agent'lar kullanır:** `qa-automation`, `code-auditor`, `debugger`, `game-architect`, `prompt-engineer`, `mobile-developer`

**Çalıştırılabilir scriptler:**
```bash
# Jest spec dosyası üretir (unit | integration | e2e), gerçekten dosya yazar
node .agents/skills/development/qa-testing/scripts/tdd_generator.js UserService \
  --target unit --typescript --out __tests__/

# CI log'larından flaky test tespiti (>20% fail rate) + hardcoded wait taraması
node .agents/skills/development/qa-testing/scripts/flakiness_analyzer.js \
  --logs ci-logs/ --src src/

# JSX/TSX'ten data-testid'leri çıkarır, Cypress/Playwright POM yazar
node .agents/skills/development/qa-testing/scripts/e2e_page_object.js \
  --src src/ --framework playwright --out tests/pages/
```

---

### `ai-engineering/prompt-design`

**Ne sağlar:** Prompt token maliyet analizi (Gemini 3.1 Pro, Claude Sonnet 4.6, GPT-4o güncel fiyatlar), Jaccard diversity ile few-shot seçimi, A/B değerlendirme (latency tahminli, per-example breakdown).

**Hangi agent'lar kullanır:** `prompt-engineer`

**Çalıştırılabilir scriptler:**
```bash
# Token sayısı ve aylık maliyet tahmini (word × 1.33 heuristic)
# Modeller: claude-sonnet-4-6 ($3/$15), gpt-4o ($2.5/$10), gemini-3.1-pro ($2/$12)
python .agents/skills/ai-engineering/prompt-design/scripts/cost_estimator.py ./prompt.txt \
  --model gemini-3.1-pro --requests-per-month 50000

# Jaccard similarity ile diverse few-shot örnek seçimi
python .agents/skills/ai-engineering/prompt-design/scripts/few_shot_generator.py completions.jsonl --k 3

# İki prompt'u karşılaştır: skor, latency tahmini, per-example breakdown
python .agents/skills/ai-engineering/prompt-design/scripts/ab_evaluator.py prompt_v1.txt prompt_v2.txt \
  --dataset evals.csv --show-breakdown
```

---

### `creative-design/ui-design-system`

**Ne sağlar:** React/Vue/Svelte component scaffolding (gerçek dosya yazar: .tsx + .module.css + .test.tsx + .stories.tsx), HSL renk skalası token üretimi (tailwind.config.js + variables.css + tokens.json), 5 kurallı a11y lint (WCAG referanslı).

**Hangi agent'lar kullanır:** `ui-ux-designer`, `senior-frontend`

**Çalıştırılabilir scriptler:**
```bash
# React: .tsx + .module.css + .test.tsx + .stories.tsx üretir
node .agents/skills/creative-design/ui-design-system/scripts/component_scaffolder.js \
  --name DataTable --framework react --out src/components
# Vue veya Svelte için:
node .agents/skills/creative-design/ui-design-system/scripts/component_scaffolder.js \
  --name Card --framework vue --out src/ui

# Hex/HSL/RGB → Tailwind config + CSS custom properties + tokens.json (oklch notu dahil)
node .agents/skills/creative-design/ui-design-system/scripts/token_generator.js \
  --color "#3b82f6" --name primary --out tokens/

# WCAG A/AA/AAA etiketli a11y lint (img alt, button boş, tabindex, aria-label boş, role="button")
node .agents/skills/creative-design/ui-design-system/scripts/a11y_linter.js ./src
```

---

### `creative-design/frontend-design`

**Ne sağlar:** UI/UX tasarım prensipleri, wireframe mantığı, bilgi mimarisi, görsel hiyerarşi tavsiyeleri, kullanıcı akışı analizi.

**Hangi agent'lar kullanır:** `ui-ux-designer`

---

## Workflows Referansı (10)

Slash komutları kurulumdan sonra AI chat'inde aktif olur.

> Canonical path platformdan platforma değişir. Compat export tüm platformlarda `.agents/workflows/*.md` altında oluşturulur.

---

### `/audit`

**Ne tetikler:** `code-auditor` modunu etkinleştirir — OWASP + kalite + mimari denetimi.

**Adım adım ne olur:**
1. Hedef dosya/dizini okur
2. OWASP taraması çalıştırır (SQL injection, XSS, hardcoded secret, IDOR, weak crypto)
3. Cyclomatic complexity ve God Method analizi yapar
4. Mimari katman ihlallerini kontrol eder
5. HIGH → MED → LOW sıralı önceliklendirilmiş rapor çıkarır

**Örnek:**
```text
/audit src/payment/PaymentService.ts
```

---

### `/test`

**Ne tetikler:** Test üretimi — unit, integration veya E2E.

**Adım adım ne olur:**
1. Hedef modülün public interface'ini analiz eder
2. Happy path + edge case + hata senaryolarını belirler
3. Seçilen framework için çalıştırılabilir dosya üretir

**Örnek:**
```text
/test src/auth/AuthController.ts
```

---

### `/commit`

**Ne tetikler:** Conventional Commits formatında commit mesajı üretimi.

**Adım adım ne olur:**
1. Staged değişiklikleri analiz eder
2. Değişikliğin tipini belirler (feat/fix/refactor/perf/chore...)
3. Tek satır, maksimum bilgi yoğunluklu mesaj üretir

**Örnek:**
```text
/commit
→ feat(auth): add JWT refresh token rotation with 7-day sliding window
```

---

### `/frontend`

**Ne tetikler:** UI/UX + web performance odaklı mod.

**Adım adım ne olur:**
1. Bileşen yapısını ve render modelini analiz eder
2. Core Web Vitals (LCP, FID, CLS) açısından değerlendirir
3. Erişilebilirlik ve tasarım tokeni önerileri ekler

**Örnek:**
```text
/frontend src/components/Dashboard.tsx
```

---

### `/backend`

**Ne tetikler:** API, veritabanı ve güvenlik odaklı backend modu.

**Adım adım ne olur:**
1. Endpoint contract, auth middleware, rate limiting kontrol eder
2. Veritabanı sorgusu performans analizi yapar
3. Güvenlik açıklarını raporlar

**Örnek:**
```text
/backend src/api/OrdersController.ts
```

---

### `/db`

**Ne tetikler:** Database mimarisi ve sorgu optimizasyonu modu.

**Adım adım ne olur:**
1. Sorgu veya şemayı analiz eder
2. Index önerisi üretir (equality first, range last kuralı)
3. Migration risk değerlendirmesi yapar

**Örnek:**
```text
/db SELECT * FROM orders WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC
```

---

### `/debug`

**Ne tetikler:** Sistematik hata teşhis modu.

**Adım adım ne olur:**
1. Semptomları, stack trace'i ve logları toplar
2. Olası kök neden hipotezleri listeler
3. Doğrulama adımlarını sıralar
4. Kök neden + çözüm sunar

**Örnek:**
```text
/debug [paste stack trace here]
```

---

### `/ai`

**Ne tetikler:** Prompt mühendisliği ve LLM optimizasyon modu.

**Adım adım ne olur:**
1. Prompt'u token maliyeti açısından analiz eder
2. Model-spesifik format önerileri sunar (Claude XML, Gemini Markdown, GPT JSON Schema)
3. Optimize edilmiş prompt artifact üretir

**Örnek:**
```text
/ai Bu sistem prompt'u için maliyet analizi yap ve Gemini 3.1 Pro'ya uyarla.
```

---

### `/mobile`

**Ne tetikler:** React Native / Flutter odaklı mobil geliştirme modu.

**Adım adım ne olur:**
1. Platform hedefini (iOS/Android/both) belirler
2. Performans ve batarya optimizasyonu prensiplerini uygular
3. Platform-spesifik farklılıkları açıklar

**Örnek:**
```text
/mobile Bu React Native ekranı iOS'ta yavaş, FlatList'i optimize et.
```

---

### `/manage-roles`

**Ne tetikler:** Gereksiz agent rollerini devre dışı bırakarak token tasarrufu.

**Adım adım ne olur:**
1. Mevcut aktif rolleri listeler
2. Aktif görevle ilgisi olmayan rolleri kapatır
3. Tahmini token bütçesi tasarrufu gösterir

**Örnek:**
```text
/manage-roles
```

---

## Platform-Specific Notlar

### Claude Code (Folder Mode)

- Context yönetimi: `Glob` ve `Grep` araçlarıyla `.claude/skills/` ve proje dosyalarını tara.
- Skills otomatik mount edilir — içeriği yeniden açıklama.
- Extended thinking: karmaşık mimari kararlar için etkinleştir.
- XML tagging: `<context>`, `<thinking>`, `<result>` yapısını kullan.
- Script path: `.claude/skills/<kategori>/<skill>/scripts/`

### Gemini 3.1 Pro (`gemini-3.1-pro-preview`) ← Yeni

Gemini 3.1 Pro, 19 Şubat 2026'da yayınlandı. ARC-AGI-2'de #1, 1M token context.

- **Temperature:** 1.0'dan aşağı çekme — looping ve output degradation riski.
- **Kısıtlamalar:** Negatif constraint'leri prompt'un **son satırına** koy — başa koyunca model drop ediyor.
- **Large context:** Önce veriyi ver (dosya, codebase, video), sonra soruyu/talimatı koy.
- **File referansları:** `@file:path.py` syntax — büyük içeriği kopyalayıp yapıştırma.
- **Format tutarlılığı:** XML ya da Markdown — ikisini karıştırma. Nested XML güvenilir değil.
- **Flat mode:** Kurulumda tüm skills tek `.gemini/*.md` dosyasına bundle'lanır.

```bash
# Gemini kurulumu
agentskills init --agent senior-backend --ai gemini
# → .gemini/senior-backend.md + .gemini/commands/*.md üretir
```

### Codex

- Bootstrap: `AGENTS.md` önce okunur — routing instructions buraya koy.
- Pseudocode ve step-by-step instructions prose'dan daha güvenilir.
- Structured output için JSON Schema kullan (XML'den güvenilir).
- `.codex/*.md` dosyaları `AGENTS.md` managed block ile desteklenir.

### Cursor / Windsurf

- Rules her zaman inject edilir — manuel aktivasyon gerekmez.
- Workflow'lar `.cursor/commands/` veya `.windsurf/commands/` altında slash komutları olarak çalışır.
- `@codebase` veya IDE file reference sistemi context için kullanılır.

---

## Kurulum Rehberi

### NPM (önerilen)

```bash
npm install -g @cagriemiracikkapi-projects/agentskills-cli
agentskills init --agent <agent-adı> --ai <platform>
```

### GitHub fallback

```bash
npm install -g git+https://github.com/cagriemiracikkapi-projects/AgentSkills.git#main:cli
```

### Local geliştirme

```bash
git clone https://github.com/cagriemiracikkapi-projects/AgentSkills.git
cd AgentSkills/cli
npm install && npm link
agentskills init --agent senior-backend --ai claude --local
```

### Domain paketleri

| Domain | Dahil olan agent'lar |
|---|---|
| `backend` | `senior-backend`, `devops-engineer`, `qa-automation`, `code-auditor` |
| `frontend` | `senior-frontend`, `ui-ux-designer`, `qa-automation`, `code-auditor` |
| `game` | `game-architect`, `qa-automation`, `code-auditor` |
| `ai` | `prompt-engineer`, `code-auditor` |
| `web` | `senior-backend`, `senior-frontend`, `devops-engineer`, `qa-automation`, `code-auditor`, `ui-ux-designer` |
| `all` | Tüm 12 agent |

### CLI parametreleri

| Parametre | Açıklama |
|---|---|
| `--agent <name>` | Tek persona kur |
| `--domain <name>` | Domain paketi kur |
| `--ai <platform>` | Hedef platform |
| `--local` | Remote yerine yerel `.agents/` kaynağı |
| `--source-repo <owner/repo>` | Remote `.agents/` kaynağını override et |
| `--source-branch <branch>` | Remote branch override |
| `--no-compat` | Compat exportlarını kapat |
| `--no-cleanup-legacy` | Legacy dosya temizliğini kapat |
| `--dry-run` | Yazma/silme yapmadan planı göster |

---

## Dosya Yapısı

```text
AgentSkills/
├── .agents/
│   ├── agents/                    # 12 agent tanımı (YAML frontmatter)
│   │   ├── senior-backend.md
│   │   ├── senior-frontend.md
│   │   ├── ui-ux-designer.md
│   │   ├── game-architect.md
│   │   ├── mobile-developer.md
│   │   ├── qa-automation.md
│   │   ├── devops-engineer.md
│   │   ├── fullstack-developer.md
│   │   ├── code-auditor.md
│   │   ├── database-architect.md
│   │   ├── debugger.md
│   │   └── prompt-engineer.md
│   ├── skills/
│   │   ├── ai-engineering/
│   │   │   └── prompt-design/
│   │   │       ├── SKILL.md
│   │   │       └── scripts/
│   │   │           ├── cost_estimator.py      # Güncel: Gemini 3.1 Pro fiyatı dahil
│   │   │           ├── few_shot_generator.py  # Jaccard diversity seçimi
│   │   │           └── ab_evaluator.py        # Latency + per-example breakdown
│   │   ├── creative-design/
│   │   │   ├── frontend-design/
│   │   │   └── ui-design-system/
│   │   │       └── scripts/
│   │   │           ├── component_scaffolder.js  # React/Vue/Svelte, gerçek dosya yazar
│   │   │           ├── token_generator.js       # HSL skala + tailwind + CSS vars + JSON
│   │   │           └── a11y_linter.js           # 5 kural, WCAG referanslı
│   │   └── development/
│   │       ├── api-design/scripts/
│   │       │   ├── endpoint_load_tester.py    # asyncio concurrent HTTP, gerçek p50/p95/p99
│   │       │   ├── openapi_generator.py       # OpenAPI 3.1.0, Express+FastAPI+Gin
│   │       │   └── api_route_scaffolder.py    # Express/FastAPI/Gin framework flag
│   │       ├── code-review/scripts/
│   │       │   ├── arch_dependency_mapper.py  # AST import + DFS circular dep
│   │       │   ├── complexity_analyzer.py     # Python AST + JS regex CC
│   │       │   └── owasp_scanner.js           # 7 kural: SQL/XSS/cmd/secret/eval/IDOR/crypto
│   │       ├── database-optimization/scripts/
│   │       │   ├── index_recommender.py       # SQL → CREATE INDEX (equality→range→ORDER)
│   │       │   ├── migration_validator.py     # 6 risk pattern (RENAME/MODIFY dahil)
│   │       │   └── slow_query_analyzer.py     # N+1 threshold=5, JSON çıktı
│   │       ├── frontend-performance/scripts/
│   │       │   ├── bundle_analyzer.js         # webpack/vite stats.json, heavy dep alert
│   │       │   ├── asset_purger.js            # CSS purge + görsel >200KB
│   │       │   └── react_profiler_parser.js   # commitData → hot component sıralaması
│   │       ├── game-performance/scripts/
│   │       │   ├── gc_allocation_scanner.py   # Update/FixedUpdate C# GC pattern
│   │       │   ├── physics_profiler_analyzer.py  # transform/Raycast/AddForce misuse
│   │       │   └── object_pool_scaffolder.py  # IDisposable + interface, gerçek .cs yazar
│   │       ├── game-development/
│   │       ├── infrastructure-iac/
│   │       └── qa-testing/scripts/
│   │           ├── tdd_generator.js           # unit|integration|e2e, TypeScript flag
│   │           ├── flakiness_analyzer.js      # log parse + hardcoded wait tarama
│   │           └── e2e_page_object.js         # data-testid → Cypress/Playwright POM
│   ├── workflows/                 # 10 slash command tanımı
│   └── global-rules.md            # Tüm agent'lara uygulanan global kurallar
├── .agent_scripts/                # CLI tarafından flat-install edilen scriptler
│   ├── development_api-design/
│   ├── development_code-review/
│   └── development_database-optimization/
├── cli/                           # AgentSkills CLI kaynak kodu
└── README.md
```

---

## Sorun Giderme

**`npm ERR! 404 agentskills-cli`**
Scoped paketi kullan:
```bash
npm install -g @cagriemiracikkapi-projects/agentskills-cli
```

**`Use either --agent or --domain, not both`**
Tek komutta `--agent` ve `--domain` birlikte kullanılamaz. Birini seç.

**`Unsupported AI assistant`**
`agentskills init --help` ile desteklenen platform listesine bak. CLI yakın yazımları önerir (`gemin` → `gemini`).

**Workflow slash komutu çalışmıyor**
1. Platformun canonical `commands/` dizinini kontrol et (bkz. Platform Destek Matrisi).
2. `.agents/workflows/` altında ilgili `.md` dosyasının olduğunu doğrula.
3. Yeni bir chat oturumu aç.

**Gemini 3.1 Pro modeli eski görünüyor**
`agentskills init` komutunu tekrar çalıştır — güncel model referanslarını source'dan çeker:
```bash
agentskills init --agent prompt-engineer --ai gemini --dry-run
```

**Script çalışmıyor — import error / module not found**
Tüm scriptler stdlib-only tasarlanmıştır. Python scriptleri için harici paket gerekmez (Python 3.8+). Node.js scriptleri için Node 20+ yeterlidir. `tiktoken`, `aiohttp` gibi paketlere gerek yoktur.

**`agent_scripts/` dizini boş veya eski scriptler var**
CLI kurulumu sırasında ağ erişim sorunu olmuş olabilir. `--local` flag ile yerel kaynaktan kur:
```bash
agentskills init --agent senior-backend --ai claude --local
```

**Kurulum yaptım ama AI direkt prompt'a yanıt vermiyor**
AI oturumunu kapat ve yeni chat aç — eski oturum kuralları cache'lemiş olabilir.

**`agent_scripts/` içindeki script kaynak dosyasından farklı**
Kaynak (`.agents/skills/*/scripts/`) güncellendiğinde `agentskills init` komutunu tekrar çalıştır; installed copies güncellenir.

---

## Katkı

```bash
# Yeni agent ekle
# → .agents/agents/<name>.md (YAML frontmatter: name, description, tools, model, skills)

# Yeni skill ekle
# → .agents/skills/<kategori>/<skill-adı>/SKILL.md + scripts/

# Yeni workflow ekle
# → .agents/workflows/<name>.md

# İçerik doğrulama
cd cli && npm run validate:content
```
