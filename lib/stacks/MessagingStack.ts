import { Construct } from "constructs";
import {
    Duration,
    Stack, 
    StackProps
} from 'aws-cdk-lib';
import {
    Queue, 
    QueueEncryption
} from 'aws-cdk-lib/aws-sqs';
import {
    Rule,
    Schedule
} from 'aws-cdk-lib/aws-events';

export class MessagingStack extends Stack {
    public readonly eventRule: Rule;
    public readonly productQueue: Queue;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.eventRule = new Rule(this, "ScheduledProductUrlsRule", {
            schedule: Schedule.rate(Duration.hours(1)), 
        });

        this.productQueue = new Queue(this, "ProductUrlsQueue", {
            fifo: true,
            encryption: QueueEncryption.KMS_MANAGED
        });
    }
}