# 🧪 Nuvo Commit Testing Guide

## ✅ Unit Tests (Runs in CI)

```bash
# All unit tests
npm run test:unit

# With coverage report
npm run test:coverage

# Single test file
npx jest src/utils/sanitize.test.ts
```

## 🚀 Manual Extension Testing

### Method 1: Debug Mode (Recommended)

1. Press **F5** or "Run and Debug" → "Run Extension"
2. A new VS Code window will open
3. In your test repo, run:
   ```bash
   git add .
   ```
4. Open **Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`)
5. Type `Nuvo Commit: Generate Commit Message` and press Enter
6. Commit message will be generated

### Method 2: VSIX Package

```bash
# 1. Build package
npm install -g @vscode/vsce
vsce package

# 2. Install in VS Code
# - Open Extensions panel (Cmd+Shift+X)
# - Click ⋯ → "Install from VSIX"
# - Select nuvo-commit-0.1.0.vsix
```

## 📋 Test Scenarios

### 1. Basic Commit Message
```bash
# Create test repo
mkdir test-repo && cd test-repo
git init
echo "console.log('hello')" > index.js
git add index.js

# Run extension
# Expected: "chore: add index.js" or similar
```

### 2. Ollama Integration
```bash
# Ensure Ollama is running
ollama serve

# Check if model is loaded
ollama list | grep qwen3

# Install if needed
ollama pull qwen3:4b
```

### 3. Settings Test
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

## 🐛 Debugging

### Extension Logs
```bash
# Open VS Code Output panel
# Select "Extension Host"
```

### Common Issues

**"Cannot reach Ollama"**
```bash
# Start Ollama
ollama serve

# Check if port is listening
lsof -i :11434
```

**"No staged changes"**
```bash
# Stage changes
git add .
```

**Extension not showing**
```bash
# Restart VS Code
# Run: Developer: Reload Window (Cmd+Shift+P)
```

## 🎯 Quick Test Checklist

- [ ] Unit tests passing (`npm run test:unit`)
- [ ] Extension opens with F5
- [ ] Command visible in Command Palette
- [ ] Commit message generated from staged changes
- [ ] Ollama responding
- [ ] Settings working
- [ ] Error handling informs user

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
