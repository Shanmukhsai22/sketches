import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import Notebook from '@/models/Notebook';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectDB();

    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    let userId = null;
    //const userName = 'Anonymous';

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }

    switch (req.method) {
      case 'GET':
        const notebooks = await Notebook.find()
          .populate('user', 'name email')
          .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, notebooks });

        case 'POST':
          try {
            const notebook = new Notebook({
              title: req.body.title,
              content: '',
              createdBy: req.body.createdBy,
              user: userId
            });
        
            await notebook.save();
            const populatedNotebook = await notebook.populate('user', 'name email');
        
            return res.status(201).json({
              success: true,
              notebook: {
                ...notebook.toObject(),
                user: populatedNotebook.user
              }
            });
          } catch (error) {
            console.error('Error creating notebook:', error);
            return res.status(500).json({
              success: false,
              message: 'Error creating notebook'
            });
          }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}