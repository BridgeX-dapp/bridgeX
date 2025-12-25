type RedisConnection = {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  tls?: Record<string, unknown>;
};

function parseRedisUrl(url: string): RedisConnection {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  };
}

export const localRedisConnection: RedisConnection = {
  host: '127.0.0.1',
  port: 6379,
};

export const remoteRedisConnection: RedisConnection | null = process.env
  .REDIS_URL
  ? parseRedisUrl(process.env.REDIS_URL)
  : null;

export const redisConnection: RedisConnection =
  remoteRedisConnection ?? localRedisConnection;
