import { config } from '@/lib/config';
import { serializeCookie } from '@/lib/cookie';
import { createToken, encryptToken } from '@/lib/crypto';
import { prisma } from '@/lib/db';
import { User, userSelect } from '@/lib/db/models/user';
import { combine } from '@/lib/middleware/combine';
import { method } from '@/lib/middleware/method';
import { ziplineAuth } from '@/lib/middleware/ziplineAuth';
import { NextApiReq, NextApiRes } from '@/lib/response';

export type ApiUserTokenResponse = {
  user?: User;
  token?: string;
};

export async function handler(req: NextApiReq, res: NextApiRes<ApiUserTokenResponse>) {
  const u = await prisma.user.findFirstOrThrow({
    where: {
      id: req.user.id,
    },
    select: {
      avatar: true,
    },
  });

  if (!u.avatar) return res.notFound();

  u.avatar = u.avatar.replace(/^data:image\/\w+;base64,/, '');
  const buf = Buffer.from(u.avatar, 'base64');

  res.setHeader('Content-Length', buf.length);

  return res.send(buf);
}

export default combine([method(['GET']), ziplineAuth()], handler);
