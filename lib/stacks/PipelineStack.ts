import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    CodePipeline,
    CodePipelineSource,
    ShellStep
} from 'aws-cdk-lib/pipelines';
import { SecretValue } from 'aws-cdk-lib';
import { PipelineStageStack } from './PipelineStageStack';

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);
        const pipeline = new CodePipeline(this, "ServerlessScraperPipeline", {
            synth: new ShellStep("Synth", {
                input: CodePipelineSource.gitHub("anthonyrojas/ServerlessPricesScraper", "main", {
                    authentication: SecretValue.secretsManager("serverless-scraper-github-token"),
                }),
                commands: [
                    "npm ci",
                    "npm install",
                    "npm run build",
                    "npx cdk synth"
                ],
                primaryOutputDirectory: "cdk.out"
            }),
            dockerEnabledForSelfMutation: true,
            dockerEnabledForSynth: true
        });
        pipeline.addStage(new PipelineStageStack(this, "ProdStage", {}))
    }
}