# AgentSkills

Bu depo, Codex, Claude ve Gemini gibi yapay zeka asistanları için optimize edilmiş, genel kurallarını ve özel yeteneklerini (skills) içerir. Asistanın projelere entegrasyonu, verimli çalışması (minimum token/minimum süre), özel çıktılar vermesi ve Git Commit mesajlarının otomatikleştirilmesine yönelik direktifleri sağlamaktır.

## Başlıca Özellikler

1. **Bağlama Sadakat:** Yapay zeka'nın tanımlı bağlamın dışına çıkmaması ve gereksiz "selamlama" ya da şablonsal mesajlardan kaçınması sağlanır.
2. **Minimum Token, Maksimum Verim:** Token tüketimini her zaman izleyen, kısa ve doğrudan çıktı sunan yönergeler.
3. **Takım Mimarisi (Roller & İş Akışları):** Frontend, Backend, DevOps, Veritabanı gibi spesifik rollere ayrılmış ajan yetenekleri ve `/audit`, `/commit` gibi tetikleyici iş akışları (workflows).
4. **Özelleştirilmiş Commit Mesajları:** "Commitle" dendiğinde projeyi analiz edip yalnızca `feat(subject): ***` gibi formatlarla, duruma özgü Git mesajı üreten bir özellik.

## Kurulum ve Entegrasyon
Bu yapıyı ("Müşterek Kurallar", "Roller" ve "İş Akışları") herhangi bir projenize hızlıca indirmek için aşağıdaki betikleri kullanabilirsiniz:

### Windows İçin (PowerShell)
Projenizin ana klasöründe PowerShell açın ve aşağıdaki komutu çalıştırın:
```powershell
iex (irm https://raw.githubusercontent.com/<YOUR_GITHUB_USERNAME>/AgentSkills/main/install.ps1)
```

### macOS / Linux İçin
```bash
curl -sL https://raw.githubusercontent.com/<YOUR_GITHUB_USERNAME>/AgentSkills/main/install.sh | bash
```

**Not:** Bu dosyayı GitHub'a pushlamadan önce `YOUR_GITHUB_USERNAME` yazılarını kendi GitHub kullanıcı adınızla değiştirmeyi unutmayın.

## Ajanları IDE ve CLI'da Kullanma (Yol Haritası)

Ajanlar (Roller) ve İş Akışları (Workflows), farklı araçlarda şu şekilde kullanılabilir:

### 1. Cursor IDE
Kurulum scripti ajanları oluşturur. Cursor, Cmd+K veya Chat bölümünde `@` işareti ile bu dosyaları bağlama dahil edebilir.
- **Komut Örneği:** `Sen `@auditor` rolündesin. `@login.ts` dosyasını incele ve bana bir denetim raporu sun.`
- **İş Akışı Örneği:** Sadece `/audit` yazarak `.agents/workflows/audit.md` dosyasındaki talimatları tetikleyebilirsiniz.

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
