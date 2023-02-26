import { Construct } from "constructs";
import {
    Duration,
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
    DockerImageCode,
    DockerImageFunction,
    Function,
    Runtime
} from "aws-cdk-lib/aws-lambda";
import {
    Queue,
    QueueEncryption
} from 'aws-cdk-lib/aws-sqs';
import {
    Rule,
    Schedule
} from 'aws-cdk-lib/aws-events';
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as path from 'path'


interface ComputeStackProps extends StackProps {
    productsTable: Table;
    pricesTable: Table;
}

export class ComputeStack extends Stack {
    public readonly eventRule: Rule;
    public readonly productQueue: Queue;
    public readonly getProducts: NodejsFunction;
    public readonly getProductUrls: NodejsFunction;
    public readonly getProductPrices: NodejsFunction;
    public readonly queueProductUrls: NodejsFunction;
    public readonly createProduct: NodejsFunction;
    public readonly createProductUrl: NodejsFunction;
    public readonly deleteProductUrl: NodejsFunction;
    public readonly scrapePrices: Function;
    constructor(scope: Construct, id: string, props: ComputeStackProps) {
        super(scope, id, props);
        const productsTableName: string = props.productsTable.tableName;
        const pricesTableName: string = props.pricesTable.tableName;
        this.eventRule = new Rule(this, "ScheduledProductUrlsRule", {
            schedule: Schedule.cron({
                hour: "2",
                minute: "0",
            }),
        });

        this.productQueue = new Queue(this, "ProductUrlsQueue", {
            fifo: true,
            encryption: QueueEncryption.KMS_MANAGED
        });
        this.getProducts = new NodejsFunction(this, "GetProducts", {
            entry: path.join(__dirname, "/../../src/get-product/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName
            },
            runtime: Runtime.NODEJS_18_X,
            memorySize: 256,
            timeout: Duration.seconds(15)
        });
        this.getProductUrls = new NodejsFunction(this, "GetProductUrls", {
            entry: path.join(__dirname, "/../../src/get-product-url/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName
            },
            runtime: Runtime.NODEJS_18_X,
            memorySize: 256,
            timeout: Duration.seconds(15)
        });
        this.getProductPrices = new NodejsFunction(this, "GetProductPrices", {
            entry: path.join(__dirname, "/../../src/get-product-prices/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName
            },
            runtime: Runtime.NODEJS_18_X,
            memorySize: 256,
            timeout: Duration.seconds(15)
        });
        this.queueProductUrls = new NodejsFunction(this, "QueueProductUrls", {
            entry: path.join(__dirname, "/../../src/queue-product-urls/index.ts"),
            handler: 'handler',
            environment: {
                PRICES_TABLE_NAME: pricesTableName,
                QUEUE_URL: this.productQueue.queueUrl
            },
            runtime: Runtime.NODEJS_18_X,
            memorySize: 256,
            timeout: Duration.seconds(15)
        });
        this.createProduct = new NodejsFunction(this, "CreateProduct", {
            entry: path.join(__dirname, "/../../src/create-product/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName
            },
            runtime: Runtime.NODEJS_18_X,
            memorySize: 256,
            timeout: Duration.seconds(15)
        });
        this.createProductUrl = new NodejsFunction(this, "CreateProductUrl", {
            entry: path.join(__dirname, "/../../src/create-product-url/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName
            },
            runtime: Runtime.NODEJS_18_X,
            memorySize: 256,
            timeout: Duration.seconds(15)
        });
        this.deleteProductUrl = new NodejsFunction(this, "DeleteProductUrl", {
            entry: path.join(__dirname, "/../../src/delete-product-url/index.ts"),
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTableName,
                PRICES_TABLE_NAME: pricesTableName
            },
            runtime: Runtime.NODEJS_18_X,
            memorySize: 256,
            timeout: Duration.seconds(15)
        });
        this.addPermissions(props.productsTable, props.pricesTable, this.productQueue);
        // add queue lambda as event target
        this.eventRule.addTarget(new LambdaTarget(this.queueProductUrls));

        this.scrapePrices = new DockerImageFunction(this, 'ScrapePrices', {
            code: DockerImageCode.fromImageAsset(path.join(__dirname, "../../src/scrape-price/")),
            memorySize: 1024,
            timeout: Duration.minutes(3)
        });
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