// Placeholder legal copy — replace with real, lawyer-reviewed text before
// submitting to the App Store / Play Store. Keep the same section shape
// (title + body) so LegalScreen.tsx doesn't need changes when you swap it.
// The Turkish text below is a straightforward translation, not legal
// advice — like the English original, get it reviewed by a lawyer before
// using it as the actual published policy.
import type { SupportedLocale } from '../i18n';

export interface LegalSection {
  title: string;
  body: string;
}

interface LegalContent {
  privacyUpdated: string;
  privacySections: LegalSection[];
  termsUpdated: string;
  termsSections: LegalSection[];
}

const CONTENT: Record<SupportedLocale, LegalContent> = {
  en: {
    privacyUpdated: 'Last updated: [DATE — fill in on real publish]',
    privacySections: [
      {
        title: 'What stays on your device',
        body: 'Your session history, streak, coins, achievements, and settings are stored only on this device (local storage). Don\'t Touch does not require an account and does not ask for your name, email, or phone number.',
      },
      {
        title: 'Anonymous usage data',
        body: 'We use PostHog to understand how the app is used (e.g. which goal lengths are popular, where people drop off) via a random identifier generated on your device — never your name, email, or device advertising ID unless you\'ve granted tracking permission for ad personalization.',
      },
      {
        title: 'Crash reports',
        body: 'We use Sentry to receive crash and error reports so we can fix bugs. These reports may include technical details (device model, OS version, a stack trace) but not your personal information.',
      },
      {
        title: 'Advertising',
        body: 'If you watch a rewarded ad (to double coins or save a streak), the ad is served by Google AdMob. On iOS, we ask for App Tracking Transparency permission before any ad personalization; declining still lets you watch ads, just without personalization.',
      },
      {
        title: 'Subscriptions',
        body: 'Premium purchases are processed by Apple/Google through RevenueCat. We receive your purchase and entitlement status, never your payment details.',
      },
      {
        title: 'Friend Duel (fully optional)',
        body: 'If you create or join a Friend Duel, your device generates a random ID and your run result is stored on our Supabase backend so your opponent can see it. This only happens if you open the Duel screen and use the feature — it is off by default.',
      },
      {
        title: 'Global stats (fully optional)',
        body: 'If you turn on "Contribute to global stats" in Settings, the duration of your completed runs is added to an anonymous, aggregate worldwide counter. No individual run or device can be identified from this counter.',
      },
      {
        title: 'Your choices',
        body: 'You can reset all local data at any time from Settings → Reset Progress. You can decline notification and tracking permissions at any time from your device settings.',
      },
      {
        title: 'Contact',
        body: '[Insert a real support email before publishing.]',
      },
    ],
    termsUpdated: 'Last updated: [DATE — fill in on real publish]',
    termsSections: [
      {
        title: 'Using the app',
        body: "Don't Touch is a self-discipline game. It has no medical, therapeutic, or safety claims — it's entertainment and a personal productivity tool, not a substitute for professional advice about screen time or digital wellbeing.",
      },
      {
        title: 'Subscriptions',
        body: 'Premium is an auto-renewing subscription billed through your App Store or Play Store account. It renews automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel it from your device\'s subscription settings.',
      },
      {
        title: 'Virtual currency',
        body: "Coins earned or purchased in the app have no real-world monetary value, cannot be exchanged for cash, and are forfeited if you delete the app or reset your progress.",
      },
      {
        title: 'Friend Duel conduct',
        body: 'Friend Duel is meant for consenting participants you know. Don\'t use it to harass or spam other people with invite codes.',
      },
      {
        title: 'No warranty',
        body: 'The app is provided "as is." We work to keep session timing and streak calculations accurate but cannot guarantee the app is free of bugs.',
      },
      {
        title: 'Changes',
        body: 'We may update these terms as the app evolves. Continued use after an update means you accept the revised terms.',
      },
      {
        title: 'Contact',
        body: '[Insert a real support email before publishing.]',
      },
    ],
  },
  tr: {
    privacyUpdated: 'Son güncelleme: [TARİH — gerçek yayında doldurulacak]',
    privacySections: [
      {
        title: 'Cihazında kalanlar',
        body: 'Oturum geçmişin, serin, coin\'lerin, başarımların ve ayarların sadece bu cihazda (yerel depolama) saklanır. Don\'t Touch hesap gerektirmez, adını, e-postanı veya telefon numaranı sormaz.',
      },
      {
        title: 'Anonim kullanım verisi',
        body: 'Uygulamanın nasıl kullanıldığını (örneğin hangi hedef sürelerin popüler olduğunu, kullanıcıların nerede bıraktığını) anlamak için PostHog kullanıyoruz — cihazında oluşturulan rastgele bir kimlik üzerinden, reklam kişiselleştirmesi için izin vermediğin sürece asla adın, e-postan veya cihaz reklam kimliğin üzerinden değil.',
      },
      {
        title: 'Çökme raporları',
        body: 'Hataları düzeltebilmek için çökme ve hata raporları almak amacıyla Sentry kullanıyoruz. Bu raporlar teknik detaylar (cihaz modeli, işletim sistemi sürümü, bir stack trace) içerebilir ama kişisel bilgini içermez.',
      },
      {
        title: 'Reklamlar',
        body: 'Ödüllü bir reklam izlersen (coin\'leri ikiye katlamak ya da bir seriyi kurtarmak için), reklam Google AdMob tarafından sunulur. iOS\'ta, herhangi bir reklam kişiselleştirmesinden önce App Tracking Transparency izni isteriz; reddetmen reklamları izlemeni engellemez, sadece kişiselleştirme olmadan gösterilir.',
      },
      {
        title: 'Abonelikler',
        body: 'Premium satın almaları RevenueCat aracılığıyla Apple/Google tarafından işlenir. Satın alma ve hak durumunu alırız, ödeme bilgilerini asla almayız.',
      },
      {
        title: 'Arkadaş Düellosu (tamamen isteğe bağlı)',
        body: 'Bir Arkadaş Düellosu oluşturur veya katılırsan, cihazın rastgele bir kimlik üretir ve rakibinin görebilmesi için oturum sonucun Supabase altyapımızda saklanır. Bu sadece Düello ekranını açıp özelliği kullanırsan gerçekleşir — varsayılan olarak kapalıdır.',
      },
      {
        title: 'Küresel istatistikler (tamamen isteğe bağlı)',
        body: 'Ayarlar\'da "Küresel istatistiklere katkıda bulun"u açarsan, tamamladığın oturumların süresi anonim, toplu bir dünya genelinde sayaca eklenir. Bu sayaçtan tek bir oturum ya da cihaz tespit edilemez.',
      },
      {
        title: 'Seçimlerin',
        body: 'Ayarlar → İlerlemeyi Sıfırla üzerinden dilediğin zaman tüm yerel veriyi sıfırlayabilirsin. Bildirim ve izleme izinlerini dilediğin zaman cihaz ayarlarından reddedebilirsin.',
      },
      {
        title: 'İletişim',
        body: '[Yayınlamadan önce gerçek bir destek e-postası ekleyin.]',
      },
    ],
    termsUpdated: 'Son güncelleme: [TARİH — gerçek yayında doldurulacak]',
    termsSections: [
      {
        title: 'Uygulamayı kullanmak',
        body: "Don't Touch bir öz-disiplin oyunudur. Tıbbi, terapötik veya güvenlikle ilgili hiçbir iddiası yoktur — ekran süresi veya dijital iyilik hali hakkında profesyonel tavsiyenin yerini tutmayan, eğlence amaçlı bir kişisel üretkenlik aracıdır.",
      },
      {
        title: 'Abonelikler',
        body: 'Premium, App Store veya Play Store hesabın üzerinden faturalandırılan otomatik yenilenen bir aboneliktir. Mevcut dönemin bitiminden en az 24 saat önce iptal edilmediği sürece otomatik olarak yenilenir. Cihazının abonelik ayarlarından yönetebilir veya iptal edebilirsin.',
      },
      {
        title: 'Sanal para birimi',
        body: 'Uygulamada kazanılan veya satın alınan coin\'lerin gerçek dünyada parasal değeri yoktur, nakde çevrilemez ve uygulamayı silersen veya ilerlemeni sıfırlarsan kaybedilir.',
      },
      {
        title: 'Arkadaş Düellosu davranış kuralları',
        body: 'Arkadaş Düellosu, tanıdığın ve rıza gösteren katılımcılar için tasarlanmıştır. Davet kodlarıyla başkalarını taciz etmek veya spam yapmak için kullanma.',
      },
      {
        title: 'Garanti yok',
        body: '"Olduğu gibi" sağlanır. Oturum zamanlamasının ve seri hesaplamalarının doğru kalması için çalışıyoruz ama uygulamanın hatasız olduğunu garanti edemeyiz.',
      },
      {
        title: 'Değişiklikler',
        body: 'Uygulama geliştikçe bu koşulları güncelleyebiliriz. Bir güncellemeden sonra kullanmaya devam etmen, güncellenmiş koşulları kabul ettiğin anlamına gelir.',
      },
      {
        title: 'İletişim',
        body: '[Yayınlamadan önce gerçek bir destek e-postası ekleyin.]',
      },
    ],
  },
};

export function legalContentForLocale(locale: SupportedLocale): LegalContent {
  return CONTENT[locale];
}
