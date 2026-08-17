# Changelog

## Faz 1 (kısmi) — Coin sink + Share — 2026-08-17

Kapsam: Expo Go / web preview ile hâlâ test edilebilen kısımlar. Gerçek AdMob SDK
entegrasyonu bilinçli olarak ertelendi — `react-native-google-mobile-ads` native kod
içerdiğinden `expo prebuild` + EAS build (veya custom dev client) gerektirir ve düz
Expo Go workflow'unu kırar. `src/services/adsService.ts` hâlâ simüle edilmiş bir
rewarded-ad sağlayıcısı; gerçek SDK'ya geçiş ayrı bir adımda yapılacak.

### Eklenenler

- **Coin sink (harcama noktası)** — `src/utils/economy.ts`
  - `STREAK_FREEZE_COST` (50 coin): bozulan bir streak'i reklam izlemeden, anında
    coin karşılığında kurtarma.
  - `COSMETIC_RING_COLORS`: Home ekranındaki boşta duran timer halkası için 5
    kozmetik renk (Classic ücretsiz, diğerleri 100–150 coin). Tamamen görsel,
    session sırasındaki danger-level renklerine dokunmuyor.
  - `AppDataContext`: `spendCoins`, `unlockCosmetic`, `saveStreakWithCoins` eklendi;
    `saveStreakWithInsurance` (reklam yolu) ile ortak `grantStreakSave` mantığını
    paylaşıyor.
  - Yeni **Store** ekranı (`src/screens/StoreScreen.tsx`) — Settings'ten
    "OPEN STORE ›" ile erişiliyor, kozmetik renkleri satın alma/seçme.
  - `SessionResultScreen`: streak kırıldığında artık iki seçenek var —
    "🎬 WATCH AD" veya "🪙 50 COINS" — kullanıcı hangisini tercih ederse.

- **Sonucu Paylaş** — `src/utils/share.ts` + `SessionResultScreen`
  - React Native'in yerleşik `Share` API'si kullanıldı (yeni native bağımlılık yok,
    Expo Go'da sorunsuz çalışır).
  - Süre + (varsa) güncel streak bilgisini içeren kısa bir metin native paylaşım
    sayfasını açıyor.

### Veri modeli değişiklikleri

- `AppSettings.selectedRingColorId` eklendi (varsayılan `'classic'`).
- Yeni AsyncStorage anahtarı: `@dt/unlockedCosmetics`.
- `resetAllData()` artık kozmetik unlock'ları ve seçili rengi de sıfırlıyor.

### Değişmeyenler / korunan ilkeler

- "NO ACCOUNT REQUIRED" — tüm yeni veriler (coin, kozmetikler) tamamen cihaz-lokal,
  hiçbir ağ çağrısı eklenmedi.
- Mevcut oturum bitirme mantığı, streak hesaplama ve achievement tetikleme
  davranışları değiştirilmedi.

### Sırada (senin onayınla)

- Faz 1'in geri kalanı: `react-native-google-mobile-ads` ile gerçek rewarded/
  interstitial reklam — bu adımdan önce `expo prebuild` + EAS build kararını
  vermen gerekiyor.
- Faz 2: RevenueCat abonelik entegrasyonu + `expo-notifications` ile streak
  hatırlatmaları.
