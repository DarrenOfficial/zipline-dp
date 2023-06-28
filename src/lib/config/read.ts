import bytes from 'bytes';
import msFn from 'ms';

type EnvType = 'string' | 'number' | 'boolean' | 'byte' | 'ms';

export type ParsedEnv = ReturnType<typeof readEnv>;

export const PROP_TO_ENV: Record<string, string> = {
  'core.port': 'CORE_PORT',
  'core.hostname': 'CORE_HOSTNAME',
  'core.secret': 'CORE_SECRET',
  'core.databaseUrl': 'CORE_DATABASE_URL',

  'files.route': 'FILES_ROUTE',
};

export function readEnv() {
  const envs = [
    env(PROP_TO_ENV['core.port'], 'core.port', 'number'),
    env(PROP_TO_ENV['core.hostname'], 'core.hostname', 'string'),
    env(PROP_TO_ENV['core.secret'], 'core.secret', 'string'),
    env(PROP_TO_ENV['core.databaseUrl'], 'core.databaseUrl', 'string'),

    env(PROP_TO_ENV['files.route'], 'files.route', 'string'),
  ];

  const raw = {
    core: {
      port: undefined,
      hostname: undefined,
      secret: undefined,
      databaseUrl: undefined,
    },
    files: {
      route: undefined,
    },
  };

  for (let i = 0; i !== envs.length; ++i) {
    const env = envs[i];
    const value = process.env[env.variable];
    if (value === undefined) continue;

    const parsed = parse(value, env.type);
    if (parsed === undefined) continue;

    setDotProp(raw, env.property, parsed);
  }

  return raw;
}

function env(variable: string, property: string, type: EnvType) {
  return {
    variable,
    property,
    type,
  };
}

function setDotProp(obj: Record<string, any>, property: string, value: unknown) {
  const parts = property.split('.');
  const last = parts.pop()!;

  for (let i = 0; i !== parts.length; ++i) {
    const part = parts[i];
    const next = obj[part];

    if (typeof next === 'object' && next !== null) {
      obj = next;
    } else {
      obj = obj[part] = {};
    }
  }

  obj[last] = value;
}

function parse(value: string, type: EnvType) {
  switch (type) {
    case 'string':
      return string(value);
    case 'number':
      return number(value);
    case 'boolean':
      return boolean(value);
    case 'byte':
      return byte(value);
    case 'ms':
      return ms(value);
    default:
      return undefined;
  }
}

function string(value: string) {
  return value;
}

function number(value: string) {
  const num = Number(value);
  if (isNaN(num)) return undefined;

  return num;
}

function boolean(value: string) {
  if (value === 'true') return true;
  if (value === 'false') return false;

  return undefined;
}

function byte(value: string) {
  return bytes(value);
}

function ms(value: string) {
  return msFn(value);
}