import { Construct } from 'constructs';
import {
    Stack,
    StackProps
} from 'aws-cdk-lib';
import {
    Table,
    AttributeType,
    BillingMode
} from "aws-cdk-lib/aws-dynamodb";

export class DatabaseStack extends Stack {
    public readonly productsTable: Table;
    public readonly pricesTable: Table;
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        this.productsTable = new Table(this, "TsScraperProducts", {
            partitionKey: {
                name: "pk",
                type: AttributeType.STRING
            },
            sortKey: {
                name: "sk",
                type: AttributeType.STRING
            },
            billingMode: BillingMode.PAY_PER_REQUEST
        });
        this.pricesTable = new Table(this, "TsScraperPrices", {
            partitionKey: {
                name: "pk",
                type: AttributeType.STRING
            },
            sortKey: {
                name: "sk",
                type: AttributeType.NUMBER
            },
            billingMode: BillingMode.PAY_PER_REQUEST,
            timeToLiveAttribute: "expirationTimestamp"
        });
    }
}