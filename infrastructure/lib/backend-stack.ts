import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';

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
      timeToLiveAttribute: 'ttl',
    });

    // GSI1: To list all items of a type (e.g., GSI1PK="CAR", GSI1SK="PLATE")
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: cdk.aws_dynamodb.AttributeType.STRING },
    });

    // GSI2: To query all sessions for a given operator (GSI2PK="OPERATOR#name")
    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: cdk.aws_dynamodb.AttributeType.STRING },
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
        // JWT_SECRET: aggiungere manualmente dalla console AWS o via SecretsManager
      }
    });

    // Permessi DynamoDB
    table.grantReadWriteData(apiLambda);

    // =========================
    // Lambda schedulata: stop lavorazioni alle 18:30 ora italiana
    // EventBridge usa UTC: 16:30 UTC = 18:30 CEST (estate), 17:30 CET (inverno)
    // =========================

    const stopSessionsLambda = new lambda.Function(this, 'StopSessionsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../api')),
      handler: 'stopAllSessionsHandler.stopAllSessionsHandler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      environment: {
        NODE_ENV: 'production',
        DYNAMODB_TABLE_NAME: table.tableName,
      },
    });

    table.grantReadWriteData(stopSessionsLambda);

    // Cron: ogni giorno alle 16:30 UTC (18:30 CEST / 17:30 CET)
    new events.Rule(this, 'StopSessionsSchedule', {
      schedule: events.Schedule.cron({ minute: '30', hour: '16' }),
      targets: [new targets.LambdaFunction(stopSessionsLambda)],
      description: 'Ferma tutte le lavorazioni attive alle 18:30 ora italiana (CEST)',
    });

    // =========================
    // HTTP API
    // =========================

    const frontendUrl = 'https://d2ld5a0t7j1xb8.cloudfront.net';

    const httpApi = new HttpApi(this, 'HttpApi', {
      apiName: 'PanzaniDesign-Backend-API',
      corsPreflight: {
        allowOrigins: [frontendUrl, 'http://localhost:5173', 'http://localhost:5174'],
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