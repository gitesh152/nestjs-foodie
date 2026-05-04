import * as bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const saltRounds = 10;

export const hashPassword = async (password: string) =>
  await bcrypt.hash(password, saltRounds);

export const comparePassword = async (
  password: string,
  hashedPassword: string,
) => await bcrypt.compare(password, hashedPassword);

export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');
