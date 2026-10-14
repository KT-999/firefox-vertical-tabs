/**
 * DOM 與 SVG 輔助工具函數
 * 避免使用 innerHTML 以符合 Mozilla AMO 安全審查規範
 */

/**
 * 建立安全的 SVG 圖示元素
 * @param {string} pathD - SVG 路徑字串 (d 屬性)
 * @param {number} [width=14] - 寬度
 * @param {number} [height=14] - 高度
 * @param {string} [viewBox='0 0 24 24'] - viewBox 視窗範圍
 * @returns {SVGSVGElement}
 */
export function createSvgIcon(pathD, width = 14, height = 14, viewBox = '0 0 24 24') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', pathD);

  svg.appendChild(path);
  return svg;
}
