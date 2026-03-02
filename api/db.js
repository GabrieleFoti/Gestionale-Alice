import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-central-1' });
const ddbDocClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    },
});

export const initDB = async () => {
    // DynamoDB doesn't need "sync" like Sequelize, 
    // but we can check connectivity or perform initial setup if needed.
    console.log('DynamoDB client initialized.');
};

export default ddbDocClient;
