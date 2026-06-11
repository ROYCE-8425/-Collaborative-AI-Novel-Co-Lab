import { existsSync } from 'fs';
import { join, dirname } from 'path';

// Load .env natively by searching upwards from current directory and __dirname
try {
  let dir = __dirname;
  let envPath = '';
  while (dir) {
    const checkPath = join(dir, '.env');
    if (existsSync(checkPath)) {
      envPath = checkPath;
      break;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  
  if (!envPath) {
    dir = process.cwd();
    while (dir) {
      const checkPath = join(dir, '.env');
      if (existsSync(checkPath)) {
        envPath = checkPath;
        break;
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  if (envPath) {
    (process as any).loadEnvFile(envPath);
    console.log(`[Env] Loaded environment from ${envPath}`);
  } else {
    console.log('[Env] No .env file found upwards');
  }
} catch (err) {
  console.warn('[Env] Failed to load env file natively:', err);
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  console.log(`Backend is running on: ${await app.getUrl()}`);
}
bootstrap();

