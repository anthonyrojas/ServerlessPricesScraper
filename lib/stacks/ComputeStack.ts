import { Construct } from "constructs";
import { 
    Stack,
    StackProps
} from "aws-cdk-lib";
import {
    LambdaFunction as LambdaTarget
} from 'aws-cdk-lib/aws-events-targets'
import { 
    NodejsFunction 
} from "aws-cdk-lib/aws-lambda-nodejs";
import { 
    Runtime 
} from "aws-cdk-lib/aws-lambda";
import { Rule } from "aws-cdk-lib/aws-events";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as path from 'path'


interface ComputeStackProps extends StackProps {
    productsTable: Table;
    pricesTable: Table;
    eventRule: Rule;
    productQueue: Queue;
}

export class ComputeStack extends Stack {
    public readonly getProducts: NodejsFunction;
    public readonly getProductUrls: NodejsFunction;
    public readonly getProductPrices: NodejsFunction;
    public readonly queueProductUrls: NodejsFunction;
    public readonly createProduct: NodejsFunction;
    public readonly createProductUrl: NodejsFunction;
    public readonly deleteProductUrl: NodejsFunction;
    constructor(scope: Construct, id: string, props: ComputeStackProps) {
        super(scope, id, props);
        const productsTableName: string = props.productsTable.tableName;
        const pricesTableName: string = props.pricesTable.tableName;
        this.getProducts = new NodejsFunction(this, "GetProducts", {
            entry: path.join(__dirname, "/../src/get-product/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName 
            },
            runtime: Runtime.NODEJS_18_X
        });
        this.getProductUrls = new NodejsFunction(this, "GetProductUrls", {
            entry: path.join(__dirname, "/../src/get-product-url/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName 
            },
            runtime: Runtime.NODEJS_18_X
        });
        this.getProductPrices = new NodejsFunction(this, "GetProductPrices", {
            entry: path.join(__dirname, "/../src/get-product-prices/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName 
            },
            runtime: Runtime.NODEJS_18_X
        });
        this.queueProductUrls = new NodejsFunction(this, "QueueProductUrls", {
            entry: path.join(__dirname, "/../src/queue-product-urls/index.ts"),
            handler: 'handler',
            environment: {
                PRICES_TABLE_NAME: pricesTableName,
                QUEUE_URL: props.productQueue.queueUrl
            },
            runtime: Runtime.NODEJS_18_X
        });
        this.createProduct = new NodejsFunction(this, "CreateProduct", {
            entry: path.join(__dirname, "/../src/create-product/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName 
            },
            runtime: Runtime.NODEJS_18_X
        });
        this.createProductUrl = new NodejsFunction(this, "CreateProductUrl", {
            entry: path.join(__dirname, "/../src/create-product-url/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName 
            },
            runtime: Runtime.NODEJS_18_X
        });
        this.deleteProductUrl = new NodejsFunction(this, "DeleteProductUrl", {
            entry: path.join(__dirname, "/../src/delete-product-url/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName 
            },
            runtime: Runtime.NODEJS_18_X
        });
        this.addPermissions(props.productsTable, props.pricesTable, props.productQueue);
        // add queue lambda as event target
        props.eventRule.addTarget(new LambdaTarget(this.queueProductUrls));
    }

    private addPermissions(
        productsTable: Table,
        pricesTable: Table,
        productQueue: Queue
    ) {
        // PRODUCTS TABLE PERMISSIONS
        productsTable.grantReadWriteData(this.createProduct);
        productsTable.grantReadWriteData(this.createProductUrl);
        productsTable.grantReadWriteData(this.deleteProductUrl);
        productsTable.grantReadData(this.getProductPrices);
        productsTable.grantReadData(this.getProductUrls);
        productsTable.grantReadData(this.getProducts);
        productsTable.grantReadData(this.queueProductUrls);
        // PRICES TABLE PERMISSIONS
        pricesTable.grantReadWriteData(this.createProduct);
        pricesTable.grantReadWriteData(this.createProductUrl);
        pricesTable.grantReadWriteData(this.deleteProductUrl);
        pricesTable.grantReadData(this.getProductPrices);
        pricesTable.grantReadData(this.getProductUrls);
        pricesTable.grantReadData(this.getProducts);
        pricesTable.grantReadData(this.queueProductUrls);
        // QUEUE PERMISSIONS
        productQueue.grantSendMessages(this.queueProductUrls);
    }
}