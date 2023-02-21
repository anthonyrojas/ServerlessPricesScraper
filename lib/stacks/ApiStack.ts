import { Construct } from "constructs";
import { 
    Stack,
    StackProps
} from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
    ApiKeySourceType,
    CognitoUserPoolsAuthorizer,
    RestApi,
    ApiKey,
    Period,
    LambdaIntegration
} from 'aws-cdk-lib/aws-apigateway'
import { UserPool } from "aws-cdk-lib/aws-cognito";


interface ApiStackProps extends StackProps {
    getProducts: NodejsFunction;
    getProductUrls: NodejsFunction;
    getProductPrices: NodejsFunction;
    createProduct: NodejsFunction;
    createProductUrl: NodejsFunction;
    deleteProductUrl: NodejsFunction;
    userPool: UserPool
}

export class ApiStack extends Stack {
    private readonly JSON_CONTENT_TYPE="application/json";
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);
        const api = new RestApi(this, "ScraperRestApi", {
            description: "Serverless web scraper API",
            defaultCorsPreflightOptions: {
                allowOrigins: ["*"],
                allowCredentials: true,
                allowHeaders: [
                    'Content-Type',
                    'X-Api-Key',
                    'Authorization',
                    'X-Amzn-Date'
                ],
                allowMethods: [
                    'GET',
                    'DELETE',
                    'POST',
                    'PUT',
                    'OPTIONS'
                ]
            },
            apiKeySourceType: ApiKeySourceType.HEADER
        });
        const authorizer = new CognitoUserPoolsAuthorizer(this, "ScraperRestApiAuthorizer", {
            cognitoUserPools: [props.userPool]
        });
        const apiKey = new ApiKey(this, "ScraperRestApiWebKey", {
            apiKeyName: "ScraperRestApiKey"
        });
        const usagePlan = api.addUsagePlan('ScraperRestApiUsagePlan', {
            description: "Usage plan for rate limiting the scraping rest API",
            throttle: {
                rateLimit: 100,
                burstLimit: 100
            },
            quota: {
                limit: 2500, 
                period: Period.MONTH
            },
            apiStages: [
                {
                    stage: api.deploymentStage,
                    api: api
                }
            ],
        });
        usagePlan.addApiKey(apiKey);
        /** ADD REQUEST MODELS **/
        /** ADD ROUTES WITH LAMBDA HANDLER **/
        const productResource = api.root.addResource("product");
        const productUrlResource = api.root.addResource("productUrl");
        const productPriceResource = api.root.addResource("productPrice");
        const productUrlsIdResource = productUrlResource.addResource("{productId}");
        const productPriceIdResource = productPriceResource.addResource("{productUrlId}");
        const productUrlIdProductIdResource = productUrlsIdResource.addResource("{productUrlId}");

        productResource.addMethod("GET", new LambdaIntegration(props.getProducts), {
            authorizer: authorizer,
            apiKeyRequired: true
        });
        productUrlsIdResource.addMethod("GET", new LambdaIntegration(props.getProductUrls), {
            authorizer: authorizer,
            apiKeyRequired: true,
            requestParameters: {
                "method.request.path.productId": true
            }
        });
        productPriceIdResource.addMethod("GET", new LambdaIntegration(props.getProductPrices), {
            authorizer: authorizer,
            apiKeyRequired: true,
            requestParameters: {
                "method.request.path.productUrlId": true
            }
        });
        productResource.addMethod("POST", new LambdaIntegration(props.createProduct), {
            authorizer: authorizer,
            apiKeyRequired: true
        });
        productUrlsIdResource.addMethod("POST", new LambdaIntegration(props.createProductUrl), {
            authorizer: authorizer,
            apiKeyRequired: true,
            requestParameters: {
                "method.request.path.productId": true
            }
        });
        productUrlIdProductIdResource.addMethod("DELETE", new LambdaIntegration(props.deleteProductUrl), {
            authorizer: authorizer,
            apiKeyRequired: true,
            requestParameters: {
                "method.request.path.productId": true,
                "method.request.path.productUrlId": true,
            }
        });
    }
}