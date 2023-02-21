import {
    Context
} from 'aws-lambda';
import { 
    SQSClient,
    SendMessageBatchCommand,
    SendMessageBatchCommandInput,
    SendMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import { DynamoService } from '../services/DynamoService';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ProductUrl } from '../models/ProductUrl';


export async function handler(event: any, context: Context): Promise<void> {
    const pricesTableName = process.env.PRICES_TABLE_NAME!;
    const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
    const ddbClient = new DynamoDBClient({
        region: process.env.AWS_REGION!
    });
    const dynamoService = new DynamoService(
        ddbClient, 
        productsTableName, 
        pricesTableName
    );
    try {
        // pull products
        const products = await dynamoService.getAllProducts();
        // pull product URLs
        const productUrls: ProductUrl[] = [];
        products.map(async (product) => {
            productUrls.push(...await dynamoService.getProductUrlsForProductId(product.productId));
        })
        // queue up each product URL as a separate record
        const sqs = new SQSClient({
            region: process.env.AWS_REGION!
        });
        const entries = productUrls.map(productUrl => {
            const entry: SendMessageBatchRequestEntry = {
                Id: new Date(Date.now()).getTime().toString(),
                MessageBody: JSON.stringify(productUrl),
                DelaySeconds: 10,
                MessageAttributes: {
                }
            }
            return entry;
        })
        const sendBatchMessageInput: SendMessageBatchCommandInput = {
            QueueUrl: process.env.QUEUE_URL!,
            Entries: entries
        };
        await sqs.send(new SendMessageBatchCommand(sendBatchMessageInput));
        sqs.destroy();
        dynamoService.closeConnection();
        return;
    } catch (e: any) {
        const err = e as Error;
        console.error(`Failed to queue up product urls at ${new Date(Date.now()).toDateString()}!`)
        console.error(err.message);
        console.error(err.stack)
        dynamoService.closeConnection();
        return;
    }
}