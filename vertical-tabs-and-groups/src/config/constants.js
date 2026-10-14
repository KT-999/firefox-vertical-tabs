/**
 * 垂直分頁附加元件 - 全域常數與組態設定
 */
import { t } from '../i18n/index.js';

// 支援的群組色彩定義 (符合 Chrome / Firefox 規範並相容深色模式)
export const GROUP_COLORS = {
  grey: {
    colorKey: 'colorGrey',
    main: '#5f6368',
    bg: 'rgba(95, 99, 104, 0.16)',
    text: '#202124',
    darkText: '#e8eaed'
  },
  blue: {
    colorKey: 'colorBlue',
    main: '#1a73e8',
    bg: 'rgba(26, 115, 232, 0.16)',
    text: '#1967d2',
    darkText: '#8ab4f8'
  },
  red: {
    colorKey: 'colorRed',
    main: '#d93025',
    bg: 'rgba(217, 48, 37, 0.16)',
    text: '#c5221f',
    darkText: '#f28b82'
  },
  yellow: {
    colorKey: 'colorYellow',
    main: '#f29900',
    bg: 'rgba(242, 153, 0, 0.20)',
    text: '#b06000',
    darkText: '#fdd663'
  },
  green: {
    colorKey: 'colorGreen',
    main: '#188038',
    bg: 'rgba(24, 128, 56, 0.16)',
    text: '#137333',
    darkText: '#81c995'
  },
  pink: {
    colorKey: 'colorPink',
    main: '#d01884',
    bg: 'rgba(208, 24, 132, 0.16)',
    text: '#b8006d',
    darkText: '#ff8bcb'
  },
  purple: {
    colorKey: 'colorPurple',
    main: '#a142f4',
    bg: 'rgba(161, 66, 244, 0.16)',
    text: '#8430ce',
    darkText: '#c58af9'
  },
  cyan: {
    colorKey: 'colorCyan',
    main: '#007b83',
    bg: 'rgba(0, 123, 131, 0.16)',
    text: '#00656c',
    darkText: '#78d9ec'
  },
  orange: {
    colorKey: 'colorOrange',
    main: '#e8710a',
    bg: 'rgba(232, 113, 10, 0.16)',
    text: '#c25800',
    darkText: '#fcad70'
  }
};

/**
 * 取得色彩的本地化名稱
 */
export function getColorName(colorKey) {
  const conf = GROUP_COLORS[colorKey];
  if (conf && conf.colorKey) {
    return t(conf.colorKey);
  }
  return colorKey;
}

export const DEFAULT_GROUP_COLOR = 'blue';

export const TAB_GROUP_ID_NONE = -1;
