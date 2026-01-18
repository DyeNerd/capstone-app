import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt.utils';

class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(email: string, username: string, password: string) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      username,
      password_hash,
    });

    await this.userRepository.save(user);

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, username: user.username });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, username: user.username });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
      },
      token,
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created_at,
    };
  }
}

export const authService = new AuthService();

