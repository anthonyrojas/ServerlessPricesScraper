import { Construct } from "constructs";
import {
    RemovalPolicy,
    Stack,
    StackProps
} from "aws-cdk-lib";
import {
    UserPool,
    UserPoolClient,
    AccountRecovery,
    UserPoolClientIdentityProvider,
    UserPoolEmail,
    UserPoolDomain,
    OAuthScope,
} from 'aws-cdk-lib/aws-cognito';

export class AuthStack extends Stack {
    public readonly userPoolDomain: UserPoolDomain;
    public readonly userPoolClient: UserPoolClient;
    public readonly userPool: UserPool;
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        this.userPool = new UserPool(this, "ScraperUserPool", {
            removalPolicy: RemovalPolicy.DESTROY,
            signInAliases: {
                preferredUsername: true,
                username: true,
                email: true
            },
            autoVerify: {
                email: true
            },
            passwordPolicy: {
                minLength: 6
            },
            selfSignUpEnabled: true,
            standardAttributes: {
                givenName: {
                    mutable: true,
                    required: true
                },
                familyName: {
                    mutable: true,
                    required: true
                },
                preferredUsername: {
                    mutable: false,
                    required: true
                },
                email: {
                    mutable: true,
                    required: true
                },
                birthdate: {
                    mutable: false,
                    required: true
                },
                phoneNumber: {
                    mutable: false,
                    required: false
                }
            },
            email: UserPoolEmail.withCognito(),
            accountRecovery: AccountRecovery.EMAIL_ONLY
        });
        this.userPoolDomain = this.userPool.addDomain('ScraperUserPoolDomain', {
            cognitoDomain: {
                domainPrefix: "serverlessscraperauth"
            }
        });
        this.userPoolClient = this.userPool.addClient("ScraperUserPoolClient", {
            authFlows: {
                adminUserPassword: true,
                userPassword: true,
                custom: true,
                userSrp: true,
            },
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.COGNITO
            ],
            oAuth: {
                scopes: [
                    OAuthScope.COGNITO_ADMIN,
                    OAuthScope.OPENID
                ],
                flows: {
                    implicitCodeGrant: true,
                    authorizationCodeGrant: true,
                    clientCredentials: false
                }
            },
        })
    }
}