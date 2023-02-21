import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { DynamoService } from '../services/DynamoService';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Product } from '../models/Product';
import { HttpError } from '../models/HttpError';
import { HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { HttpResponse } from '../models/HttpResponse';

export async function handler(event: APIGatewayEvent, context: Context): Promise<HttpResponse> {
    const pricesTableName = process.env.PRICES_TABLE_NAME!;
    const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
    const ddbClient = new DynamoDBClient({
        region: process.env.AWS_REGION
    });
    const dynamoService = new DynamoService(
        ddbClient, 
        productsTableName, 
        pricesTableName
    );
    try {
        if (event.httpMethod !== HttpMethod.POST) {
            throw new HttpError(`${context.functionName} does not support HTTP Methods other than POST`, 405)
        }
        if (!event.body) throw new HttpError("Missing request body.", 400);
        const bodyJson = JSON.parse(event.body);
        const product = await dynamoService.addProduct(new Product(
            bodyJson["productName"],
            new Date(Date.now()),
            new Date(Date.now())
        ));
        dynamoService.closeConnection();
        return {
            statusCode: 200,
            body: JSON.stringify({
                product: product
            })
        }
    } catch (e: any) {
        const err = e as HttpError;
        dynamoService.closeConnection();
        return err.formatToResponse();
    }
}