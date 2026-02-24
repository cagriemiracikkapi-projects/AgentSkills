# AgentSkills, çeşitli yapay zeka kodlama asistanları (Cursor, Copilot, Claude, Gemini, Windsurf vb.) için **evrensel ve modüler bir "Agent-Skill" takım çantası** kuran bir projedir.

Bu proje sayesinde AI asistanlarınızı sıradan kod botları olmaktan çıkarıp:
- **Tasarım Sistemi Mimarisi** (*Frontend Performance, UI/UX*),
- **Sistem Mimarisi** (*Veritabanı optimizasyonu, API Scaffolding*),
- **Performans Uzmanı** (*Unity ECS, DOTS, C# Bellek Yönetimi*),
- **Kalite Güvence ve Güvenlik Sorumlusu** gibi "Personalar" haline getirebilirsiniz.

> **YENİ NESİL MİMARİ:** AgentSkills V2 ile birlikte sistem `agents/` (Personalar) ve `skills/` (Yetenek setleri, scriptler ve referanslar) olarak ikiye ayrılmıştır. Örneğin, Cursor'a `senior-backend` kurduğunuzda, sistem sadece o persona'yı değil; onun bağımlı olduğu API Design ve Code Review gibi becerileri de otomatik olarak çözümleyip kurar!

## Başlıca Özellikler

1. **Bağlama Sadakat:** Yapay zeka'nın tanımlı bağlamın dışına çıkmaması ve gereksiz "selamlama" ya da şablonsal mesajlardan kaçınması sağlanır.
2. **Minimum Token, Maksimum Verim:** Token tüketimini her zaman izleyen, kısa ve doğrudan çıktı sunan yönergeler.
3. **Takım Mimarisi (Roller & İş Akışları):** Frontend, Backend, DevOps, Veritabanı gibi spesifik rollere ayrılmış ajan yetenekleri ve `/audit`, `/commit` gibi tetikleyici iş akışları (workflows).
4. **Özelleştirilmiş Commit Mesajları:** "Commitle" dendiğinde projeyi analiz edip yalnızca `feat(subject): ***` gibi formatlarla, duruma özgü Git mesajı üreten bir özellik.

## Kurulum (CLI Kullanımı)

Sistemi projenize kurmanın en modüler yolu Node.js tabanlı Merkezi Paket Yöneticisi CLI aracımızdır.

```bash
# Aracı global olarak kurun
npm install -g agentskills-cli

# İstediğiniz hedef yapay zekaya (Örn: Cursor) bağımlı bir ajan paketini kurun:
agentskills init --agent senior-backend --ai cursor

# Veya interaktif sihirbazı başlatın:
agentskills init --agent game-architect
```

### Desteklenen Asistanlar (`--ai` Parametresi)
Sistem yazdığınız komuta göre içeriği formatlar:
- `--ai cursor` veya `windsurf`: Agent ve becerileri (skill/references) harmanlayıp hızlı okunabilir bir `.mdc` dosyası oluşturur.  
- `--ai copilot` veya `codebuddy`: Sınırlı çoklu-dosya özellikleri yüzünden tüm ajan/yetenek yapısını devasa tek bir `.md` bağlam paketine birleştirir (`copilot-instructions.md`).
- `--ai claude` veya `antigravity`: Orijinal `/agents` ve `/skills` klasör ve script yapısını olduğu gibi kopyalar.

### Mevcut Personalar (`--agent` Parametresi)
Aşağıdaki ajanlardan projenize en uygun olanı seçin:
- `senior-backend`: API tasarımı, DB Optimizasyon, Güvenlik.
- `senior-frontend`: UI Design Systems, Bundle Analyzer, 60fps Performans.
- `game-architect`: Unity C#, Object Pooling, DOTS/ECS Performans.
- `qa-automation`: Edge-Case Testleri, TDD, Integration Test uzmanı.
- `devops-engineer`: CI/CD, AWS/Docker otomasyonları.
- `code-auditor`: OWASP Top 10, Code Smells analisti (Salt-Okunur).

*(Eski yöntem olan `install.sh` ve `install.ps1` scriptleri depo içerisinde `scripts/` klasöründe yedek olarak tutulmaktadır.)*

**Not:** Bu dosyayı GitHub'a pushlamadan önce `YOUR_GITHUB_USERNAME` yazılarını kendi GitHub kullanıcı adınızla değiştirmeyi unutmayın.

### 1. QA ve Test Otomasyonu (`/test`)
Yeni eklenen `qa-tester.md` rolü ve `/test` iş akışıyla kodlarınıza Edge-case, Unit test ve entegrasyon testleri (TDD mantığıyla) yazdırabilirsiniz. Sadece dosyayı işaretleyip `/test` yazmanız yeterlidir.

### 2. Dinamik Rol Optimizasyonu (`/manage-roles`)
Projelerinizde kullanmadığınız ajanların (örn. Backend projesinde Frontend rolü) token tüketmesini engellemek için tasarlanmıştır. IDE üzerinden çağrıldığında projenizin `package.json` gibi dosyalarını analiz eder ve gereksiz rolleri devre dışı bırakır.

### 2. Ajanlar Arası Oturum Aktarımı (`cli-continues`)
Claude, Gemini veya Copilot limitine takıldığınızda bağlamı (context) kaybetmemek için `npx continues` komutunu kullanarak, kaldığınız yerden diğer araçta çalışmaya devam edebilirsiniz. AgentSkills mimarisi formattan kopmadan bu transferi destekler.

### 3. Kalıcı Uzun Dönem Hafıza (`claude-mem` uyumluluğu)
Ajanlar, proje üzerinde aldıkları kritik kararları veya tamamladıkları devasa görevleri `.agents/memory/MEMORY.md` dosyasına kaydeder. Yeni bir sohbet başlattığınızda ajan önce bu belleği okur ve geçmişteki bağlamı saniyeler içerisinde hatırlar.

### 2. GitHub Copilot / Gemini IDE
Ajan kural setini "Workspace Context" olarak dahil etmeniz gerekir. Sohbet penceresinde `#file` veya `@` referanslarını kullanın.
- **Komut Örneği:** `@.agents/roles/frontend.md` kurallarına göre bu bileşeni refactor et.
- **Komut Örneği:** `/commit` işlemi için `@.agents/workflows/commit.md` yönergelerini takip et.

### 3. Gemini CLI veya Diğer Terminal Asistanları
Terminal üzerinden komut gönderirken, ajan rollerini `system-prompt` olarak verebilirsiniz:
```bash
# Backend uzmanı olarak dosyayı refactor eder.
gemini --system-prompt .agents/roles/backend.md "src/api/user.js içindeki N+1 sorununu çöz"
```

Bash içerisinde alias oluşturarak hız kazanabilirsiniz:
```bash
alias audit="gemini --system-prompt .agents/roles/auditor.md"
audit "src/index.js dosyasını güvenlik için denetle"
```

## İstenen Yeni Yetenekleri (Skills) Ekleme
Her bir yeni persona veya kuralı `roles/` veya `workflows/` klasörüne uyarlayabilirsiniz. 
`install.ps1` dosyasını güncelleyerek indirme zincirine yeni yeteneklerinizi de katabilirsiniz.
