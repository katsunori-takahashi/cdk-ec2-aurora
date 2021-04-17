import * as cdk from '@aws-cdk/core';
import {Vpc, SubnetType} from "@aws-cdk/aws-ec2";

interface NetworkContext {
  "enableDnsHostnames": boolean,
  "enableDnsSupport": boolean,
  "cidr": string,
  "natGateways": number,
  "maxAzs": number
}

export class NetworkStack extends cdk.Stack {
  private context: NetworkContext;
  public readonly vpc: Vpc;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.context = this.node.tryGetContext(this.stackName);

    this.vpc = this.createVpc();
  }

  private createVpc(): Vpc {
    return new Vpc(this, 'VPC', {
      enableDnsHostnames: this.context.enableDnsHostnames,
      enableDnsSupport: this.context.enableDnsHostnames,
      cidr: this.context.cidr,
      natGateways: this.context.natGateways,
      maxAzs: this.context.maxAzs,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        // {
        //   name: 'private',
        //   subnetType: SubnetType.PRIVATE,
        //   cidrMask: 24,
        // },
        {
          name: 'isolated',
          subnetType: SubnetType.ISOLATED,
          cidrMask: 24,
        }
      ]
    });
  }
}
