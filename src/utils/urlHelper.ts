/**
 * URL Helper Utilities
 * Ensures consistent URL formatting with trailing slashes
 */

/**
 * Ensures URL ends with trailing slash
 * Handles query parameters and hash fragments correctly
 * 
 * @param url - The URL path to normalize
 * @returns URL with trailing slash
 * 
 * @example
 * normalizeUrl('/courses') // '/courses/'
 * normalizeUrl('/courses/123') // '/courses/123/'
 * normalizeUrl('/courses?page=1') // '/courses/?page=1'
 * normalizeUrl('/courses#section') // '/courses/#section'
 */
export const normalizeUrl = (url: string): string => {
  // Empty or root URL
  if (!url || url === '/') {
    return '/';
  }

  // Check if URL has query params or hash
  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');
  
  // Find the first occurrence of ? or #
  const separatorIndex = queryIndex !== -1 && hashIndex !== -1
    ? Math.min(queryIndex, hashIndex)
    : queryIndex !== -1
    ? queryIndex
    : hashIndex;

  // If URL has query params or hash
  if (separatorIndex !== -1) {
    const path = url.substring(0, separatorIndex);
    const rest = url.substring(separatorIndex);
    return path.endsWith('/') ? url : path + '/' + rest;
  }

  // Simple path without query or hash
  return url.endsWith('/') ? url : url + '/';
};

/**
 * Builds a URL path with parameters and ensures trailing slash
 * 
 * @param path - Base path template
 * @param params - Object with parameter values
 * @returns Normalized URL with parameters replaced
 * 
 * @example
 * buildUrl('/courses/:id', { id: '123' }) // '/courses/123/'
 * buildUrl('/video/:courseId/:lessonId', { courseId: '1', lessonId: '2' }) // '/video/1/2/'
 */
export const buildUrl = (path: string, params?: Record<string, string | number>): string => {
  let url = path;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  
  return normalizeUrl(url);
};
