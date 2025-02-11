import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

type ResponseData = {
  success: boolean;
  message: string;
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
  console.log('🚀 Registration API endpoint hit');
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    console.log('📡 Attempting to connect to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');

    const { name, email, password } = req.body;
    console.log('📝 Received registration data:', { name, email, password: '****' });

    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('❌ User already exists with email:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    console.log('✅ Email is available for registration');

    // Create new user
    console.log('👤 Creating new user...');
    const user = new User({
      name,
      email,
      password // Password will be hashed by the pre-save hook
    });

    // Save user to database
    console.log('💾 Saving user to database...');
    await user.save();
    console.log('✅ User saved successfully');

    console.log('🎉 Registration successful for:', email);
    
    // Return success response without password
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }

    // Log MongoDB connection status
    if (global.mongoose?.conn) {
      console.log('MongoDB connection state:', global.mongoose.conn.connection.readyState);
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}