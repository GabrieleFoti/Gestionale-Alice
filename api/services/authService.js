import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import ddbDocClient from "../db.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { USER_PK_PREFIX, USER_SK_PREFIX } from '../entities/user.js';
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from './rateLimitService.js';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

export default function authService() {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error('JWT_SECRET must be set');
    return {
        login: async ({ username, password }) => {
            await checkRateLimit(username);

            const data = await ddbDocClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `${USER_PK_PREFIX}${username}`,
                    SK: USER_SK_PREFIX
                }
            }));
            const user = data.Item;

            if (!user) {
                await recordFailedAttempt(username);
                throw new Error('User not found');
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                await recordFailedAttempt(username);
                throw new Error('Invalid credentials');
            }

            await clearRateLimit(username);

            const token = jwt.sign(
                { id: user.PK, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            return { token, user: { username: user.username, role: user.role } };
        }
    };
}
