import ddbDocClient from "../db.js";
import { PutCommand, GetCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CAR_PK_PREFIX, CAR_SK_PREFIX, toCarItem } from "../entities/car.js";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'PanzaniDesign';

const toApiModel = (item) => ({
    id: item.PK.replace(CAR_PK_PREFIX, ''),
    name: (item.model || '') + " " + (item.plate || ''),
    model: item.model,
    plate: item.plate,
    status: item.status,
    lavorazioni: item.lavorazioni,
    note: item.note,
    partialHours: item.partialHours,
    totalHours: item.totalHours,
    photo: item.photo
});

export default function carService() {
    async function getAll(req) {
        if(!req.user) throw new Error('User not logged in');
        const params = {
            TableName: TABLE_NAME,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'CAR'
            }
        };
        const data = await ddbDocClient.send(new QueryCommand(params));
        return (data.Items || []).map(toApiModel);
    }

    async function getById(req, id) {
        if(!req.user || !id) throw new Error('User not logged in or invalid id');
        const params = {
            TableName: TABLE_NAME,
            Key: {
                PK: `${CAR_PK_PREFIX}${id}`,
                SK: CAR_SK_PREFIX
            }
        };
        const data = await ddbDocClient.send(new GetCommand(params));
        if (!data.Item) throw new Error('Car not found');
        return toApiModel(data.Item);
    }

    async function create(req, data) {
        if(!req.user) throw new Error('User not logged in');
        const id = Date.now().toString();
        const item = toCarItem({ ...data, id });
        await ddbDocClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        }));
        return toApiModel(item);
    }

    async function update(req, id, data) {
        if(!req.user || !id) throw new Error('User not logged in or invalid id');
        // Get existing to preserve unspecified fields
        const car = await getById(req, id);
        const updatedItem = toCarItem({ ...car, ...data, id });
        await ddbDocClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: updatedItem
        }));
        return toApiModel(updatedItem);
    }

    async function remove(req, id) {
        if(!req.user || !id) throw new Error('User not logged in or invalid id');
        const params = {
            TableName: TABLE_NAME,
            Key: {
                PK: `${CAR_PK_PREFIX}${id}`,
                SK: CAR_SK_PREFIX
            },
            ReturnValues: 'ALL_OLD'
        };
        const data = await ddbDocClient.send(new DeleteCommand(params));
        if (!data.Attributes) throw new Error('Car not found');
        return toApiModel(data.Attributes);
    }

    return {
        getAll,
        getById,
        create,
        update,
        remove
    };
}