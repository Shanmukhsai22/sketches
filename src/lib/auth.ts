import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

export interface Session {
  userId: string;
  email: string;
}

export const getSession = async (req: NextApiRequest): Promise<Session | null> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as Session;
    return decoded;
  } catch  {
    return null;
  }
};