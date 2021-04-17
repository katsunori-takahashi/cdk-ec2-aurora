#!/usr/bin/env node
import 'source-map-support/register';
import {App} from '@aws-cdk/core';
import {SnsStack} from "../lib/sns-stack";
import {NetworkStack} from "../lib/network-stack";
import {Ec2Stack} from "../lib/ec2-stack";
import {SecurityGroupStack} from "../lib/security-group-stack";
import {RdsStack} from "../lib/rds-stack";

const app = new App();
new SnsStack(app, 'SnsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
new NetworkStack(app, 'NetworkStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
new SecurityGroupStack(app, 'SecurityGroupStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
new Ec2Stack(app, 'Ec2Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
new RdsStack(app, 'RdsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
