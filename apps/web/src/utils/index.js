// apps/web/src/utils/index.js

/**
 * Creates a page URL for navigation
 * @param {string} pageName - The name of the page
 * @returns {string} - The URL path
 */
export function createPageUrl(pageName) {
  if (!pageName || pageName === 'Dashboard') {
    return '/'
  }
  return `/${pageName.toLowerCase()}`
}

/**
 * Gets the current page name from a URL
 * @param {string} url - The current URL pathname
 * @returns {string} - The page name
 */
export function getCurrentPageName(url) {
  if (url.endsWith('/')) url = url.slice(0, -1)
  let last = url.split('/').pop() || ''
  if (last.includes('?')) last = last.split('?')[0]
  return last || 'Dashboard'
}