import ddbDocClient from "./db.js";
import { PutCommand, GetCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { toUserItem } from "./entities/user.js";
import { toCarItem, CAR_PK_PREFIX, CAR_SK_PREFIX } from "./entities/car.js";
import bcrypt from 'bcryptjs';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

async function test() {
    console.log('Starting DynamoDB Test...');

    try {
        // 1. Create a Test User
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = toUserItem({
            username: 'testuser',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('Creating User:', user.PK);
        await ddbDocClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: user
        }));

        // 2. Get the User
        const userData = await ddbDocClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: user.PK, SK: user.SK }
        }));
        console.log('User Retrieved:', userData.Item.username);

        // 3. Create a Test Car
        const car = toCarItem({
            id: 'test-car-1',
            model: 'Fiat 500',
            plate: 'AA111BB',
            status: 'in_progress'
        });
        console.log('Creating Car:', car.PK);
        await ddbDocClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: car
        }));

        // 4. List Cars using GSI1
        const carsData = await ddbDocClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: { ':pk': 'CAR' }
        }));
        console.log('Cars Found:', carsData.Items.length);

        // Cleanup (Optional)
        // await ddbDocClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: user.PK, SK: user.SK } }));
        // await ddbDocClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: car.PK, SK: car.SK } }));

        console.log('Test completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
