# VS Code Extension Publishing Guide

## GitHub Secrets Configuration

Bu workflow'un çalışması için aşağıdaki GitHub secrets'ları ayarlamanız gerekiyor:

### 1. VS Code Marketplace (vsce) Personal Access Token

1. https://marketplace.visualstudio.com/manage adresine gidin
2. Sol menüden "Security" sekmesine tıklayın
3. "New Personal Access Token" butonuna tıklayın
4. Token'a bir isim verin (örn: `nuvo-commit-ci`)
5. "All accessible organizations" seçin
6. Oluşturulan token'ı kopyalayın
7. GitHub repository'nizde:
   - Settings → Secrets and variables → Actions
   - "New repository secret" butonuna tıklayın
   - Name: `VSCE_PAT`
   - Value: Kopyaladığınız token

### 2. Open VSX Registry Token (Opsiyonel)

Eğer Open VSX Registry'ye de publish etmek isterseniz:

1. https://open-vsx.org/user-settings/tokens adresine gidin
2. "Create New Token" butonuna tıklayın
3. Token'ı kopyalayın
4. GitHub repository'nizde:
   - Settings → Secrets and variables → Actions
   - "New repository secret" butonuna tıklayın
   - Name: `OVSX_PAT`
   - Value: Kopyaladığınız token

## Workflow Akışı

1. **Master branch'e push** yapıldığında workflow tetiklenir
2. **CI beklemesi**: Diğer test ve build workflow'larının tamamlanmasını bekler
3. **Build**: Extension derlenir ve paketlanır
4. **Publish**: VS Code Marketplace'e otomatik olarak publish edilir

## Manuel Tetikleme

Workflow'u manuel olarak da tetikleyebilirsiniz:
- GitHub repository → Actions → "Publish VS Code Extension" → "Run workflow"

## Version Yönetimi

Her publish işleminden önce `package.json` dosyasındaki `version` alanını güncellemeyi unutmayın:

```json
{
  "version": "0.1.1" // Minor veya patch versiyonunu artırın
}
```

## Gerekli CI Workflow'ları

Bu workflow, aşağıdaki check'lerin tamamlanmasını bekler:
- `Test` - Test workflow'u
- `Build` - Build workflow'u

Eğer farklı isimlerde CI workflow'larınız varsa, `publish.yml` dosyasındaki `check-name` değerlerini güncelleyin.

## Troubleshooting

### Workflow CI'yi bekliyor ama CI yoksa
- Eğer henüz CI workflow'ları oluşturmadıysanız, `wait-for-ci` job'unu kaldırabilirsiniz
- Veya check-name değerlerini mevcut workflow'larınıza göre güncelleyin

### Publish hatası alıyorsanız
- VSCE_PAT secret'ının doğru ayarlandığından emin olun
- Token'ın süresinin dolmadığını kontrol edin
- Publisher adının (`nuvocode`) marketplace'te kayıtlı olduğunu doğrulayın
