export function getAvatarUrl(path) {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    // VITE_API_BASE_URL is usually something like http://localhost:5000/api
    // We want to strip '/api' and append the path (which starts with /avatars/)
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const serverUrl = baseUrl.replace(/\/api\/?$/, '');
    
    return `${serverUrl}${path}`;
}
