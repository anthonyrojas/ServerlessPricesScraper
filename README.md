# Welcome to your CDK TypeScript project

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


## Project Description

This project is desigined to be a serverless price scraper that anyone can subscribe to track different price pages. This scraper works by adding URLs and XPATHs to the database manually. This information is then used by a scraper Lambda function written in Python and using Selenium to scrape information. The scraper function will run for up to 5 minutes. 

The price scraper is kicked off every day at 0200 where a Typescript Lambda function queues up all the URLs to be scraped into an SQS queue. This SQS queue is what triggers the scraper Lambda. 

There is full CRUD functionality for product URLs and product prices. 

This project should not be distributed as a commercial product or service, as there are some gray areas when it comes to web scraping. The main intent for this project was to learn.

### Forking the Repo

Feel free to fork this repository as you see fit.

### Requirements

In order to get this project deployed, you should have a Github personal access token in Secrets Manager with the name of `serverless-scraper-github-token`. This necessary for the pipeline to function. 

#### Deploy the Pipeline Stack

Once you have your Github personal access token in Secrets Manager, you are ready to deploy the pipeline stack. Run the following commands, assuming all NPM packages are installed:

- `cdk synth`
- `cdk list`
- `cdk deploy PipelineStack` The actual name of the stack should be revealed by the previous command.

