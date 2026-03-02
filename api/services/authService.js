import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import ddbDocClient from "../db.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { USER_PK_PREFIX, USER_SK_PREFIX } from '../entities/user.js';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

export default function authService() {
    const JWT_SECRET = process.env.JWT_SECRET || 'alice-secret-key';
    return {
        login: async ({ username, password }) => {
            const params = {
                TableName: TABLE_NAME,
                Key: {
                    PK: `${USER_PK_PREFIX}${username}`,
                    SK: USER_SK_PREFIX
                }
            };
            const data = await ddbDocClient.send(new GetCommand(params));
            const user = data.Item;

            if (!user) throw new Error('User not found');

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) throw new Error('Invalid credentials');

            const token = jwt.sign(
                { id: user.PK, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            return { token, user: { username: user.username, role: user.role } };
        }
    };
}