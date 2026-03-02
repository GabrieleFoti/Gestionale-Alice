#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PanzaniDesignBackendStack } from '../lib/backend-stack';
import { PanzaniDesignFrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

// Ambiente Regional (Express Backend + S3 Website)
const envEu = { 
  account: process.env.CDK_DEFAULT_ACCOUNT, 
  region: process.env.CDK_DEFAULT_REGION || 'eu-west-3' 
};

try {
  // Stack del Backend (Regional)
  new PanzaniDesignBackendStack(app, 'PanzaniDesignBackendStack', {
    env: envEu
  });

  // Stack del Frontend (Regional)
  new PanzaniDesignFrontendStack(app, 'PanzaniDesignFrontendStack', {
    env: envEu,
  });

} catch (error) {
  console.error('CRITICAL ERROR DURING SYNTHESIS:');
  console.error(error);
  process.exit(1);
}
