# AgentSkills (V2 Multi-Domain Architecture)

AgentSkills, çeşitli yapay zeka kodlama asistanları (Cursor, Copilot, Claude, Gemini, Windsurf vb.) için **evrensel ve modüler bir "Agent-Skill" takım çantası** kuran bir projedir.

Bu proje sayesinde AI asistanlarınızı sıradan kod botları olmaktan çıkarıp:
- **Tasarım Sistemi Mimarisi** (*Frontend Performance, UI/UX*),
- **Sistem Mimarisi** (*Veritabanı optimizasyonu, API Scaffolding*),
- **Performans Uzmanı** (*Unity ECS, DOTS, C# Bellek Yönetimi*),
- **Kalite Güvence ve Güvenlik Sorumlusu** gibi "Personalar" haline getirebilirsiniz.

> **YENİ NESİL MİMARİ:** AgentSkills V2 ile birlikte sistem `.agents/agents/` (Personalar) ve `.agents/skills/` (Yetenek setleri, scriptler ve referanslar) olarak ikiye ayrılmıştır. Örneğin, Cursor'a `senior-backend` kurduğunuzda, sistem sadece o persona'yı değil; onun bağımlı olduğu API Design ve Code Review gibi becerileri de otomatik olarak çözümleyip kurar!

*(Not: Claude Code'un efsanevi `agentTemplates` dizini, projede bir referans arşivi olarak bırakılmıştır ve ilham almak isteyen geliştiriciler tarafından incelenebilir.)*

## Başlıca Özellikler

1. **Bağlama Sadakat:** Yapay zeka'nın tanımlı bağlamın dışına çıkmaması ve gereksiz "selamlama" ya da şablonsal mesajlardan kaçınması sağlanır.
2. **Minimum Token, Maksimum Verim:** Token tüketimini her zaman izleyen, kısa ve doğrudan çıktı sunan yönergeler.
3. **Takım Mimarisi & Beceriler:** Frontend, Backend, DevOps, Game, Veritabanı gibi spesifik rollere ayrılmış ajan yetenekleri ve `/audit`, `/commit`, `/test` gibi tetikleyici iş akışları (workflows).
4. **Alana Özel Kurulum (Domain-Specific):** İster Web, ister Mobil, ister Oyun (Game) geliştiriyor olun, CLI üzerinden sadece kendi alanınızdaki ajanları yükleyerek yüz binlerce token tasarruf edersiniz.

## Kurulum (CLI Kullanımı)

Sistemi projenize kurmanın en modüler yolu Node.js tabanlı Merkezi Paket Yöneticisi CLI aracımızdır.

```bash
# Aracı global olarak kurun
npm install -g agentskills-cli

# İstediğiniz hedef yapay zekaya (Örn: Cursor) bağımlı bir ajan paketini kurun:
agentskills init --agent senior-backend --ai cursor

# Bütün bir domaini (Örn: Oyun Geliştirme) kurun:
agentskills init --domain game --ai copilot

# Veya interaktif sihirbazı başlatın:
agentskills init
```

> Not: `--agent` ve `--domain` parametreleri birbirini dışlar; aynı komutta birlikte kullanılmaz.

### Desteklenen Asistanlar (`--ai` Parametresi)
Sistem yazdığınız komuta göre içeriği formatlar ve ilgili asistanın dizinine (`.cursor/`, `.trae/`, `.roocode/` vb.) yapılandırır:

**Popüler IDE'ler:**
- `--ai cursor` veya `--ai windsurf`: Agent ve becerileri (skill/references) harmanlayıp hızlı okunabilir bir `.mdc` dosyası oluşturur. Sadece bu editörlerde çalışan çoklu-dosya kural formatını kullanır.
- `--ai copilot` veya `--ai codebuddy`: Sınırlı çoklu-dosya özellikleri yüzünden tüm ajan/yetenek yapısını devasa tek bir `.md` bağlam paketine birleştirir (`.github/copilot-instructions.md`).

**Spesifik Yapay Zeka Ajanları ve Terminal CLI'lar:**
İlgili araçların proje kökünde okudukları özel `.` (nokta) klasörlerine doğrudan kurulum yaparlar. Aşağıdaki komutları terminalinizde çalıştırmanız yeterlidir:
- **Codex:** `agentskills init --agent prompt-engineer --ai codex` -> `.codex/` dizinine kurar.
- **Kiro:** `agentskills init --agent senior-backend --ai kiro` -> `.kiro/` dizinine kurar.
- **Qoder:** `agentskills init --agent game-architect --ai qoder` -> `.qoder/` dizinine kurar.
- **Roocode:** `agentskills init --agent qa-automation --ai roocode` -> `.roocode/` dizinine kurar.
- **Trae:** `agentskills init --agent ui-ux-designer --ai trae` -> `.trae/` dizinine kurar.
- **Claude / Antigravity:** `--ai claude` veya `--ai antigravity` dendiğinde orijinal klasör ağacını olduğu gibi kopyalar.

### Mevcut Personalar (`--agent` Parametresi)
Aşağıdaki ajanlardan projenize en uygun olanı seçin. Bu personalar dünyadaki en gelişmiş "Uzman" template'lerinden ilham alınarak yaratılmıştır:
- `senior-backend`: API tasarımı, DB Optimizasyon, Güvenlik.
- `senior-frontend`: UI Design Systems, Bundle Analyzer, 60fps Performans.
- `ui-ux-designer`: Araştırma (NN/g) odaklı Arayüz Eleştirisi, Asimetrik Tasarım ve Tipografi Uzmanı.
- `game-architect`: Unity C#, Object Pooling, DOTS/ECS Performans.
- `qa-automation`: Edge-Case Testleri, TDD, E2E Test uzmanı.
- `devops-engineer`: CI/CD, AWS/Docker otomasyonları.
- `code-auditor`: OWASP Top 10, Code Smells analisti (Salt-Okunur).
- `prompt-engineer`: Token optimizasyonu, Chain-of-Thought (CoT) tasarımı, Hallucination engelleme uzmanı.

### Domain Paketleri (`--domain` Parametresi)
- `backend`: `senior-backend`, `devops-engineer`, `qa-automation`, `code-auditor`
- `frontend`: `senior-frontend`, `ui-ux-designer`, `qa-automation`, `code-auditor`
- `game`: `game-architect`, `qa-automation`, `code-auditor`
- `ai`: `prompt-engineer`, `code-auditor`
- `web`: `senior-backend`, `senior-frontend`, `devops-engineer`, `qa-automation`, `code-auditor`, `ui-ux-designer`
- `all`: Tüm desteklenen personalar

## İş Akışları (Workflows & Slash Commands)

Kurulan markdown dosyalarıyla birlikte, asistanınızı anında bir iş akışına sokabilirsiniz:

### 1. QA ve Test Otomasyonu (`/test`)
`qa-automation` ajanı ve `/test` iş akışıyla kodlarınıza Edge-case, Unit test ve entegrasyon testleri yazdırabilirsiniz. Sadece dosyayı işaretleyip IDE'nizde `/test` yazmanız yeterlidir. Ajan TDD mantığına göre hareket eder ve Flakiness (kararsızlık) engelleme kurallarını uygular.

### 2. Proje Denetimi (`/audit`)
`code-auditor` ile kodunuzda OWASP Top 10 açığı, Memory Leak veya "Arrow Code" / "God Class" kokusu (smell) arayın. Salt-okunurdur ve sadece PDF vari bir rapor üretir.

### 3. Otomatik Semantic Versiyonlama (`/commit`)
Projeyi analiz edip yalnızca `feat(subject): ***` formatında, duruma özgü Git mesajı üretir.

### 4. Dinamik Rol Optimizasyonu (`/manage-roles`)
Projelerinizde kullanmadığınız ajanların (örn. Oyun projesinde Web-Backend rolü) token tüketmesini engellemek için tasarlanmıştır. IDE üzerinden çağrıldığında projenizin yapılandırmasını analiz eder ve o an gereksiz olan rolleri devre dışı bırakır (Skill Manager mimarisi).

## Ekosistem Uyumluluğu

### Ajanlar Arası Oturum Aktarımı (`cli-continues`)
Claude, Gemini veya Copilot limitine takıldığınızda bağlamı (context) kaybetmemek için `npx continues` komutunu kullanarak, kaldığınız yerden diğer araçta çalışmaya devam edebilirsiniz. AgentSkills V2 mimarisi formattan kopmadan bu transferi destekler.

### Kalıcı Uzun Dönem Hafıza (`agent-mem` uyumluluğu)
Ajanlar, proje üzerinde aldıkları kritik kararları veya tamamladıkları devasa görevleri `.agents/memory/MEMORY.md` dosyasına kaydeder. Yeni bir sohbet başlattığınızda ajan önce bu belleği okur ve geçmişteki bağlamı saniyeler içerisinde hatırlar. 

## Katkıda Bulunma
Her bir yeni persona veya kuralı `.agents/agents/` ve `.agents/skills/` klasörüne uyarlayabilirsiniz. Yeni beceriler yazdığınızda kendi referans dökümanlarınızı (references/) ve analiz scriptlerinizi (scripts/) koymayı unutmayın.
