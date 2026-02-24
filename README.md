# AgentSkills

Bu depo, Codex, Claude ve Gemini gibi yapay zeka asistanları için optimize edilmiş, genel kurallarını ve özel yeteneklerini (skills) içerir. Asistanın projelere entegrasyonu, verimli çalışması (minimum token/minimum süre), özel çıktılar vermesi ve Git Commit mesajlarının otomatikleştirilmesine yönelik direktifleri sağlamaktır.

## Başlıca Özellikler

1. **Bağlama Sadakat:** Yapay zeka'nın tanımlı bağlamın dışına çıkmaması ve gereksiz "selamlama" ya da şablonsal mesajlardan kaçınması sağlanır.
2. **Minimum Token, Maksimum Verim:** Token tüketimini her zaman izleyen, kısa ve doğrudan çıktı sunan yönergeler.
3. **Takım Mimarisi (Roller & İş Akışları):** Frontend, Backend, DevOps, Veritabanı gibi spesifik rollere ayrılmış ajan yetenekleri ve `/audit`, `/commit` gibi tetikleyici iş akışları (workflows).
4. **Özelleştirilmiş Commit Mesajları:** "Commitle" dendiğinde projeyi analiz edip yalnızca `feat(subject): ***` gibi formatlarla, duruma özgü Git mesajı üreten bir özellik.

## Kurulum ve Entegrasyon
Bu yapıyı ("Müşterek Kurallar", "Roller" ve "İş Akışları") herhangi bir projenize hızlıca indirmek için aşağıdaki betikleri kullanabilirsiniz:

### 🚀 Hızlı Kurulum (Yeni CLI)

Artık ajanları kendi yapay zeka asistanınıza (Cursor, Copilot, Claude vb.) tek bir komutla, o asistana en uygun formatta kurabilirsiniz!

```bash
# 1. CLI aracını global olarak kurun
npm install -g agentskills-cli

# 2. Projenizin dizinine gidin
cd /sizin/projeniz

# 3. Kullandığınız yapay zeka aracına göre ajanları başlatın:
agentskills init --ai cursor      # Cursor (.cursor/rules/ içine kurar)
agentskills init --ai copilot     # GitHub Copilot (.github/copilot-instructions.md oluşturur)
agentskills init --ai claude      # Claude Code (.claude/skills/ içine kurar)
agentskills init --ai windsurf    # Windsurf (.windsurf/rules/ içine kurar)
agentskills init --ai gemini      # Gemini CLI (.gemini/ dizinine kurar)
agentskills init --ai all         # En popüler asistanlara aynı anda kurar
```

*(Eski yöntem olan `install.sh` ve `install.ps1` scriptleri depo içerisinde `scripts/` klasöründe yedek olarak tutulmaktadır.)*

**Not:** Bu dosyayı GitHub'a pushlamadan önce `YOUR_GITHUB_USERNAME` yazılarını kendi GitHub kullanıcı adınızla değiştirmeyi unutmayın.

### 1. Dinamik Rol Optimizasyonu (`/manage-roles`)
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
