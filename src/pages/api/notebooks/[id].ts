import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import Notebook from '@/models/Notebook';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();
  console.log('Connected to MongoDB');

  const { id } = req.query;
  console.log('Notebook ID:', id);

  // Get user from token
  const token = req.headers.authorization?.replace('Bearer ', '');
  let userId = null;
  let userEmail = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, email: string };
      userId = decoded.userId;
      userEmail = decoded.email;
      console.log('User ID from token:', userId);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
  }

  switch (req.method) {
    case 'GET':
      try {
        const notebook = await Notebook.findById(id).populate('user', 'name email');
        if (!notebook) {
          return res.status(404).json({ 
            success: false, 
            message: 'Notebook not found' 
          });
        }
        console.log('Retrieved notebook:', notebook);
        return res.status(200).json({ 
          success: true, 
          notebook,
          isOwner: notebook.createdBy === userEmail || notebook.user?._id.toString() === userId
        });
      } catch (error) {
        console.error('Error fetching notebook:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching notebook' 
        });
      }

    case 'PUT':
      try {
        // Check if user owns the notebook
        const existingNotebook = await Notebook.findById(id);
        if (!existingNotebook) {
          return res.status(404).json({ 
            success: false, 
            message: 'Notebook not found' 
          });
        }

        // Check ownership
        if (existingNotebook.createdBy !== userEmail && existingNotebook.user?.toString() !== userId) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have permission to update this notebook' 
          });
        }

        console.log('Updating notebook with data:', req.body);
        const notebook = await Notebook.findByIdAndUpdate(
          id,
          { 
            ...req.body,
            updatedAt: new Date()
          },
          { 
            new: true,
            runValidators: true 
          }
        );

        console.log('Updated notebook:', notebook);
        return res.status(200).json({ success: true, notebook });
      } catch (error) {
        console.error('Error updating notebook:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error updating notebook' 
        });
      }

    case 'DELETE':
      try {
        // Check if user owns the notebook
        const notebook = await Notebook.findById(id);
        if (!notebook) {
          return res.status(404).json({ 
            success: false, 
            message: 'Notebook not found' 
          });
        }

        // Check ownership
        if (notebook.createdBy !== userEmail && notebook.user?.toString() !== userId) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have permission to delete this notebook' 
          });
        }

        await Notebook.findByIdAndDelete(id);
        return res.status(200).json({ 
          success: true, 
          message: 'Notebook deleted successfully' 
        });
      } catch (error) {
        console.error('Error deleting notebook:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error deleting notebook' 
        });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ 
        success: false, 
        message: `Method ${req.method} Not Allowed` 
      });
  }
}