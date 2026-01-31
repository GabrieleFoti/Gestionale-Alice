import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../entities/user.js';

export default function authService() {
    const JWT_SECRET = process.env.JWT_SECRET || 'alice-secret-key';
    return {
        login: async ({ username, password }) => {
            const user = await User.findOne({ where: { username } });
            if (!user) throw new Error('User not found');

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) throw new Error('Invalid credentials');

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            return { token, user: { username: user.username, role: user.role } };
        }
    };
}