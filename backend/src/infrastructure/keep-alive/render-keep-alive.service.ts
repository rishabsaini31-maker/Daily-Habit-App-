/**
 * Render Keep-Alive Auto-Ping Service:
 * Prevents Render Free Tier web service from sleeping (spinning down after 15m idle).
 * Sends a lightweight GET ping to /health every 10 minutes.
 */
export class RenderKeepAliveService {
  private static timer: NodeJS.Timeout | null = null;

  static start(intervalMinutes: number = 10): void {
    if (this.timer) return;

    // Detect target URL from Render env or fallback to live production URL
    const baseUrl =
      process.env.KEEP_ALIVE_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      'https://daily-habit-app.onrender.com';

    const pingUrl = baseUrl.endsWith('/health') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/health`;

    console.log(`[KeepAlive] 🕒 Initializing Render Free Tier keep-alive auto-pinger`);
    console.log(`[KeepAlive] 🎯 Target URL: ${pingUrl} (every ${intervalMinutes} minutes)`);

    // Initial warm-up ping 20 seconds after server start
    setTimeout(() => {
      this.executePing(pingUrl);
    }, 20000);

    // Recurring ping loop every intervalMinutes
    this.timer = setInterval(() => {
      this.executePing(pingUrl);
    }, intervalMinutes * 60 * 1000);

    // Ensure timer does not prevent process exit if server shuts down
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  private static async executePing(url: string): Promise<void> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DHI-Render-KeepAlive/1.0' },
      });
      if (res.ok) {
        console.log(`[KeepAlive 💓] Server kept active: ${url} (status: ${res.status})`);
      } else {
        console.warn(`[KeepAlive ⚠️] Server responded with status ${res.status}: ${url}`);
      }
    } catch (err: any) {
      console.warn(`[KeepAlive ⚠️] Self-ping failed:`, err.message);
    }
  }

  static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
