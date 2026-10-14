/**
 * 國際化語系模組 (i18n Module)
 * 判斷 Firefox 介面語言設定：若非繁體中文 (zh-TW / zh-HK / zh-MO / zh-Hant) 則一律採用英文 (en)
 */
import zhTW from './locales/zh-TW.js';
import en from './locales/en.js';

const extApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

/**
 * 偵測 Firefox 語言環境
 * @returns {'zh-TW' | 'en'}
 */
export function detectLocale() {
  let lang = '';

  try {
    if (extApi && extApi.i18n && typeof extApi.i18n.getUILanguage === 'function') {
      lang = extApi.i18n.getUILanguage();
    }
  } catch (e) {
    console.debug('i18n: 無法取得 extApi.i18n.getUILanguage()', e);
  }

  if (!lang) {
    lang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  }

  const normalized = lang.toLowerCase().replace('_', '-');

  // 判斷是否為繁體中文環境 (zh-TW, zh-HK, zh-MO, zh-Hant 等)
  const isTraditionalChinese =
    normalized === 'zh-tw' ||
    normalized === 'zh-hk' ||
    normalized === 'zh-mo' ||
    normalized.startsWith('zh-hant') ||
    normalized.startsWith('zh-tw-') ||
    normalized.startsWith('zh-hk-');

  return isTraditionalChinese ? 'zh-TW' : 'en';
}

export const currentLocale = detectLocale();
const messages = currentLocale === 'zh-TW' ? zhTW : en;

/**
 * 取得多國語系翻譯字串
 * @param {string} key - 詞條鍵名
 * @param {Record<string, string | number>} [params] - 變數替換參數
 * @returns {string}
 */
export function t(key, params = {}) {
  let text = messages[key] || en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return text;
}

/**
 * 自動翻譯 DOM 節點中帶有 data-i18n 屬性的靜態元素
 */
export function applyDomTranslations() {
  document.title = t('title');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      const val = t(key);
      el.setAttribute('title', val);
      el.setAttribute('aria-label', val);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key));
  });
}
