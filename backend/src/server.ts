import { createApp } from '@/app';
import { env } from '@/config/env';
import { REQUEST_LIMITS } from '@/config/security';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const SHUTDOWN_GRACE_MS = 10_000;

const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API listening');
});

server.requestTimeout = REQUEST_LIMITS.TIMEOUT_MS;

function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'Shutting down');

  const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_GRACE_MS);
  forceExit.unref();

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
