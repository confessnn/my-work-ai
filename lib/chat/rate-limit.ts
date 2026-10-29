// Shared by all requests in one server process; no user-supplied IP header is trusted.
export class ChatLimiter {
  private recent: number[] = [];
  private daily: number[] = [];
  private active = 0;
  acquire(now = Date.now()): { release: () => void } | { retryAfter: number } {
    this.recent = this.recent.filter((t) => now - t < 60000);
    this.daily = this.daily.filter((t) => now - t < 86400000);
    if (this.daily.length >= 200)
      return {
        retryAfter: Math.max(
          1,
          Math.ceil((this.daily[0] + 86400000 - now) / 1000),
        ),
      };
    if (this.recent.length >= 10)
      return {
        retryAfter: Math.max(
          1,
          Math.ceil((this.recent[0] + 60000 - now) / 1000),
        ),
      };
    if (this.active >= 2) return { retryAfter: 5 };
    this.recent.push(now);
    this.daily.push(now);
    this.active++;
    let released = false;
    return {
      release: () => {
        if (!released) {
          this.active--;
          released = true;
        }
      },
    };
  }
}
const state = globalThis as typeof globalThis & {
  myWorkChatLimiter?: ChatLimiter;
};
export const limiter = (state.myWorkChatLimiter ??= new ChatLimiter());
