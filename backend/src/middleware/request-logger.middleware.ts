import { Request, Response, NextFunction } from 'express';

// ANSI terminal color helpers
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return colors.cyan;
    case 'POST':
      return colors.green;
    case 'PUT':
    case 'PATCH':
      return colors.yellow;
    case 'DELETE':
      return colors.red;
    default:
      return colors.magenta;
  }
}

function getStatusColor(status: number): string {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  if (status >= 200) return colors.green;
  return colors.reset;
}

function getActionIcon(path: string, method: string): string {
  if (path.includes('/focus/sessions')) return '⏱️ ';
  if (path.includes('/focus/blocked-targets')) return '🛡️ ';
  if (path.includes('/focus/interceptions')) return '⚡ ';
  if (path.includes('/focus/metrics') || path.includes('/insights')) return '📊 ';
  if (path.includes('/focus/friend-lock')) return '🔐 ';
  if (path.includes('/auth')) return '🔑 ';
  if (path.includes('/habits')) return '🌱 ';
  if (path.includes('/health')) return '💓 ';
  if (method === 'POST') return '🚀 ';
  if (method === 'DELETE') return '🗑️ ';
  return '📡 ';
}

/**
 * High-visibility HTTP Request & Response Logger for Developer Terminal
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    const methodColor = getMethodColor(method);
    const statusColor = getStatusColor(status);
    const icon = getActionIcon(url, method);

    // Sanitize and summarize body if present
    let bodySummary = '';
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body && Object.keys(req.body).length > 0) {
      const sanitized = { ...req.body };
      if (sanitized.password) sanitized.password = '***';
      if (sanitized.token) sanitized.token = '***';
      try {
        const bodyStr = JSON.stringify(sanitized);
        bodySummary = ` ${colors.gray}body: ${bodyStr.length > 90 ? bodyStr.slice(0, 90) + '...' : bodyStr}${colors.reset}`;
      } catch {
        // ignore serialization errors
      }
    }

    const logLine = `${colors.gray}[${timestamp}]${colors.reset} ${icon}${methodColor}${colors.bold}${method.padEnd(6)}${colors.reset} ${url} ${statusColor}${colors.bold}${status}${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}${bodySummary}`;

    console.log(logLine);
  });

  next();
}
