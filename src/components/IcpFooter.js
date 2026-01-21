import { icpConfig } from '../config/icp.config.js'

/**
 * 创建ICP备案号footer组件
 * @returns {HTMLElement} ICP footer元素
 */
export function createIcpFooter() {
  // 如果未启用，返回空fragment
  if (!icpConfig.enabled) {
    return document.createDocumentFragment()
  }

  // 创建footer容器
  const footer = document.createElement('footer')
  footer.className = 'icp-footer'

  // 创建链接
  const link = document.createElement('a')
  link.href = icpConfig.beianUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.className = 'icp-link'
  link.textContent = `ICP备案号: ${icpConfig.icpNumber}`

  footer.appendChild(link)

  return footer
}
