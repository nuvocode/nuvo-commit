# 🧪 Nuvo Commit Test Rehberi

## ✅ Unit Testler (CI'da çalışıyor)

```bash
# Tüm unit testler
npm run test:unit

# Coverage raporu ile
npm run test:coverage

# Tek bir test dosyası
npx jest src/utils/sanitize.test.ts
```

## 🚀 Extension Manuel Testi

### Yöntem 1: Debug Mode (Önerilen)

1. **F5** tuşuna bas veya "Run and Debug" → "Run Extension"
2. Yeni bir VS Code penceresi açılacak
3. Test edilecek repo'da çalış:
   ```bash
   git add .
   ```
4. **Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`)
5. `Nuvo Commit: Generate Commit Message` yaz ve Enter
6. Commit mesajı oluşturulacak

### Yöntem 2: VSIX Package

```bash
# 1. Package oluştur
npm install -g @vscode/vsce
vsce package

# 2. VS Code'da yükle
# - Extensions panelini aç (Cmd+Shift+X)
# - ⋯ menüsünden "Install from VSIX"
# - nuvo-commit-0.1.0.vsix dosyasını seç
```

### Yöntem 3: Extension Development Host

```bash
# Terminal'de
code --extensionDevelopmentPath=/Users/ozerozdas/Dev/companies/nuvocode/infra/nuvo-commit
```

## 📋 Test Senaryoları

### 1. Temel Commit Mesajı
```bash
# Test repo oluştur
mkdir test-repo && cd test-repo
git init
echo "console.log('hello')" > index.js
git add index.js

# Extension'ı çalıştır
# Beklenen: "chore: add index.js" veya benzeri
```

### 2. Farklı Değişiklik Tipleri
```bash
# Yeni dosya
echo "new file" > new.txt
git add new.txt

# Değişiklik
echo "modified" >> existing.txt
git add existing.txt

# Silme
git rm old.txt
```

### 3. Ollama Entegrasyonu
```bash
# Ollama'nın çalıştığından emin ol
ollama serve

# Model yüklü mü kontrol et
ollama list | grep qwen3

# Değilse yükle
ollama pull qwen3:4b
```

### 4. Ayarlar Testi
VS Code Settings (`Cmd+,`):
```json
{
  "nuvoCommit.provider": "ollama",
  "nuvoCommit.model": "qwen3:4b",
  "nuvoCommit.ollamaEndpoint": "http://localhost:11434/api/generate",
  "nuvoCommit.maxDiffChars": 12000,
  "nuvoCommit.autoCommit": false
}
```

## 🐛 Hata Ayıklama

### Extension Logları
```bash
# VS Code Output panelini aç
# "Extension Host" seç
```

### Ollama Hataları
- Ollama çalışıyor mu? `ollama list`
- Endpoint doğru mu? Varsayılan: `http://localhost:11434/api/generate`
- Model yüklü mü? `ollama pull qwen3:4b`

### Common Issues

**"Cannot reach Ollama"**
```bash
# Ollama'yı başlat
ollama serve

# Port dinleniyor mu?
lsof -i :11434
```

**"No staged changes"**
```bash
# Değişiklikleri stage et
git add .
```

**Extension görünmüyor**
```bash
# VS Code'u yeniden başlat
# Developer: Reload Window (Cmd+Shift+P)
```

## 🔍 Integration Test (Otomatik)

```bash
# VS Code instance'ında çalıştır
npm test

# Not: X server gerektirir, macOS'ta sorun olabilir
# CI'da xvfb ile çalışır
```

## 📊 Coverage Raporu

```bash
npm run test:coverage

# coverage/lcov-report/index.html dosyasını aç
open coverage/lcov-report/index.html
```

## 🎯 Hızlı Test Checklist

- [ ] Unit testler geçiyor (`npm run test:unit`)
- [ ] Extension F5 ile açılıyor
- [ ] Command Palette'de komut görünüyor
- [ ] Staged değişikliklerle commit mesajı üretiliyor
- [ ] Ollama yanıt veriyor
- [ ] Ayarlar çalışıyor
- [ ] Hata durumlarında kullanıcı bilgilendiriliyor

## 💡 İpuçları

1. **Geliştirme sırasında**: F5 ile debug mode kullan
2. **Paylaşım öncesi**: `vsce package` ile .vsix oluştur
3. **CI/CD**: GitHub Actions otomatik test yapıyor
4. **Hata ayıklama**: Output panelinde "Extension Host" loglarını kontrol et
