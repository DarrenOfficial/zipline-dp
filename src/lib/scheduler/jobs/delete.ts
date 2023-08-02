import { datasource } from '@/lib/datasource';
import { IntervalJob } from '..';
import { bytes } from '@/lib/bytes';

export default function deleteJob(prisma: typeof globalThis.__db__) {
  return async function (this: IntervalJob) {
    const expiredFiles = await prisma.file.findMany({
      where: {
        deletesAt: {
          lte: new Date(),
        },
      },
      select: {
        name: true,
        id: true,
        size: true,
      },
    });

    this.logger.debug(`found ${expiredFiles.length} expired files`, {
      files: expiredFiles.map((f) => f.name),
    });

    for (const file of expiredFiles) {
      await datasource.delete(file.name);
    }

    const { count } = await prisma.file.deleteMany({
      where: {
        id: {
          in: expiredFiles.map((f) => f.id),
        },
      },
    });

    if (count)
      this.logger.info(`deleted ${count} expired files`, {
        size: bytes(expiredFiles.reduce((acc, f) => acc + f.size, 0)),
        files: expiredFiles.map((f) => f.name),
      });
  };
}