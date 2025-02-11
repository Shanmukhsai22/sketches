import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

type ResponseData = {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('🚀 Login API endpoint hit');

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    console.log('📡 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');

    const { email, password } = req.body;
    console.log('📝 Login attempt for email:', email);

    // Basic validation
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    console.log('🔍 Looking up user in database...');
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    console.log('✅ User found in database');

    // Verify password
    console.log('🔐 Verifying password...');
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    console.log('✅ Password verified successfully');

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-fallback-secret',
      { expiresIn: '24h' }
    );
    console.log('✅ JWT token generated');

    // Return success response
    console.log('🎉 Login successful for:', email);
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }

    // Log MongoDB connection status
    if (global.mongoose?.conn) {
      console.log('MongoDB connection state:', global.mongoose.conn.connection.readyState);
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}