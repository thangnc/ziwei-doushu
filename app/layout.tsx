import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Noto_Serif } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LocaleProvider } from '@/components/LocaleProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL } from '@/lib/site';
import { getLocale, getT } from '@/lib/i18n/server';
import { HTML_LANG, LOCALES, OG_LOCALE } from '@/lib/i18n/locales';

// 越南语界面字体（含 vietnamese 子集）。中文界面不使用，CSS 变量只在 :root[lang="vi"] 下接入，见 globals.css。
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});
const notoSerif = Noto_Serif({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-noto-serif',
});

// 语言由 cookie 决定（同一 URL 服务两种语言），读 cookie 使页面按请求动态渲染；SEO 限制见 lib/i18n/README.md。
export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: t('meta.keywords'),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      url: SITE_URL,
      siteName: t('meta.siteName'),
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      type: 'website',
    },
    // 站长平台验证（拿到 verification code 后填入对应字段，重新部署即可）
    verification: {
      // Google Search Console: 在 https://search.google.com/search-console 添加站点后获取
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
      // Bing Webmaster Tools: 在 https://www.bing.com/webmasters 添加站点后获取
      other: {
        'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '808FFC6023A2C359B375DD860FEDA856',
        // 百度站长（等执照下来后）
        'baidu-site-verification': process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
        // 360 站长（等执照下来后）
        '360-site-verification': process.env.NEXT_PUBLIC_360_VERIFICATION || '',
      },
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={HTML_LANG[locale]} className={`${beVietnamPro.variable} ${notoSerif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <LanguageSwitcher />
        </LocaleProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
