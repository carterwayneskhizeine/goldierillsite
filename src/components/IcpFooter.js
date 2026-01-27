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

  // 创建内容容器
  const content = document.createElement('div')
  content.className = 'icp-footer-content'

  // 如果有公网安备案配置，先添加
  if (icpConfig.gonganConfig) {
    const gonganContainer = document.createElement('div')
    gonganContainer.className = 'icp-footer-item'

    // 创建图标
    const icon = document.createElement('img')
    icon.src = icpConfig.gonganConfig.iconPath
    icon.alt = '备案图标'
    icon.className = 'icp-footer-icon'

    // 创建链接
    const link = document.createElement('a')
    link.href = icpConfig.gonganConfig.beianUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.className = 'icp-link'
    link.textContent = icpConfig.gonganConfig.beianNumber

    gonganContainer.appendChild(icon)
    gonganContainer.appendChild(link)
    content.appendChild(gonganContainer)
  }

  // 如果启用了ICP备案号，添加
  if (icpConfig.icpNumber) {
    const icpContainer = document.createElement('div')
    icpContainer.className = 'icp-footer-item'

    const link = document.createElement('a')
    link.href = icpConfig.beianUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.className = 'icp-link'
    link.textContent = `ICP备案号: ${icpConfig.icpNumber}`

    icpContainer.appendChild(link)
    content.appendChild(icpContainer)
  }

  footer.appendChild(content)

  return footer
}
