import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

import {
  HttpApi,
  CorsHttpMethod,
  HttpMethod,
} from '@aws-cdk/aws-apigatewayv2-alpha';

import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export class PanzaniDesignBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // =========================
    // DynamoDB Table
    // =========================

    const table = new cdk.aws_dynamodb.Table(this, 'PanzaniDesignTable', {
      tableName: 'PanzaniDesign',
      partitionKey: { name: 'PK', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep data on stack deletion
    });

    // GSI1: To list all items of a type (e.g., GSI1PK="CAR", GSI1SK="PLATE")
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: cdk.aws_dynamodb.AttributeType.STRING },
    });

    // =========================
    // Lambda
    // =========================

    const apiLambda = new lambda.Function(this, 'BackendLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../api')),
      handler: 'main.apiHandler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        DYNAMODB_TABLE_NAME: table.tableName,
      }
    });

    // Permessi DynamoDB
    table.grantReadWriteData(apiLambda);

    // =========================
    // HTTP API
    // =========================

    const httpApi = new HttpApi(this, 'HttpApi', {
      apiName: 'PanzaniDesign-Backend-API',
      corsPreflight: {
        allowOrigins: ['*'],
        allowHeaders: [
          'Content-Type',
          'Authorization'
        ],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.PATCH
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    const integration = new HttpLambdaIntegration(
      'LambdaIntegration',
      apiLambda
    );

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [
        HttpMethod.GET,
        HttpMethod.POST,
        HttpMethod.PUT,
        HttpMethod.DELETE,
        HttpMethod.PATCH
      ],
      integration,
    });

    // =========================
    // Output
    // =========================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
    });
  }
}