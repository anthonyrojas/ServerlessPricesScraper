import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './stacks/ApiStack';
import { AuthStack } from './stacks/AuthStack';
import { ComputeStack } from './stacks/ComputeStack';
import { DatabaseStack } from './stacks/DatabaseStack';
import { MessagingStack } from './stacks/MessagingStack';

export class PipelineStageStack extends cdk.Stack {
  private readonly STACK_NAME_PREFIX = "ServerlessScraper";
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const databaseStack = new DatabaseStack(this, `${this.STACK_NAME_PREFIX}DatabaseStack`);
    const messagingStack = new MessagingStack(this, `${this.STACK_NAME_PREFIX}MessagingStack`);
    const computeStack = new ComputeStack(this, `${this.STACK_NAME_PREFIX}ComputeStack`, {
      pricesTable: databaseStack.pricesTable,
      productsTable: databaseStack.productsTable,
      productQueue: messagingStack.productQueue,
      eventRule: messagingStack.eventRule
    });
    computeStack.addDependency(databaseStack);
    computeStack.addDependency(messagingStack);
    const authStack = new AuthStack(this, `${this.STACK_NAME_PREFIX}AuthStack`);
    const apiStack = new ApiStack(this, `${this.STACK_NAME_PREFIX}ApiStack`, {
      createProduct: computeStack.createProduct,
      createProductUrl: computeStack.createProductUrl,
      getProductPrices: computeStack.getProductPrices,
      getProducts: computeStack.getProducts,
      getProductUrls: computeStack.getProductUrls,
      deleteProductUrl: computeStack.deleteProductUrl,
      userPool: authStack.userPool
    });
    apiStack.addDependency(authStack);
    apiStack.addDependency(computeStack);
  }
}
