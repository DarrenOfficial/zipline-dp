import Logger from 'lib/logger';
import { isMainThread, workerData } from 'worker_threads';
// import ffmpeg from 'ffmpeg-static';

import prisma from 'lib/prisma';
import datasource from 'lib/datasource';
import config from 'lib/config';
import { spawn } from 'child_process';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { File } from '@prisma/client';
import ffmpeg from 'ffmpeg-static';
import { rm } from 'fs/promises';

const { id } = workerData as { id: number };

const logger = Logger.get('worker::thumbnail').child(id.toString() ?? 'unknown-ident');

if (isMainThread) {
  logger.error('worker is not a thread');
  process.exit(1);
}

async function loadThumbnail(path) {
  const args = ['-i', path, '-frames:v', '1', '-f', 'mjpeg', 'pipe:1'];

  const child = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'ignore'] });

  const data = await new Promise((resolve, reject) => {
    child.stdout.once('data', resolve);
    child.once('error', reject);
  });

  return data as unknown as Buffer;
}

async function loadFileTmp(file: File) {
  const stream = await datasource.get(file.name);

  // pipe to tmp file
  const tmpFile = join(config.core.temp_directory, `zipline_thumb_${file.id}_${file.id}.tmp`);
  const fileWriteStream = createWriteStream(tmpFile);

  await new Promise((resolve, reject) => {
    stream.pipe(fileWriteStream);
    stream.once('error', reject);
    stream.once('end', resolve);
  });

  return tmpFile;
}

async function start() {
  const file = await prisma.file.findUnique({
    where: {
      id,
    },
  });

  if (!file) {
    logger.error('file not found');
    process.exit(1);
  }

  if (!file.mimetype.startsWith('video/')) {
    logger.info('file is not a video');
    process.exit(0);
  }

  if (file.thumbnailId) {
    logger.info('thumbnail already exists');
    process.exit(0);
  }

  const tmpFile = await loadFileTmp(file);
  logger.debug(`loaded file to tmp: ${tmpFile}`);
  const thumbnail = await loadThumbnail(tmpFile);
  logger.debug(`loaded thumbnail: ${thumbnail.length} bytes mjpeg`);

  const { thumbnail: thumb } = await prisma.file.update({
    where: {
      id: file.id,
    },
    data: {
      thumbnail: {
        create: {
          name: `.thumb-${file.id}.jpg`,
        },
      },
    },
    select: {
      thumbnail: true,
    },
  });

  await datasource.save(thumb.name, thumbnail);

  logger.info(`thumbnail saved - ${thumb.name}`);
  logger.debug(`thumbnail ${JSON.stringify(thumb)}`);

  logger.debug(`removing tmp file: ${tmpFile}`);
  await rm(tmpFile);

  process.exit(0);
}

start();