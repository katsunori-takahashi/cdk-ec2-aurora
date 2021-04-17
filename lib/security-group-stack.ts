import * as cdk from '@aws-cdk/core';
import {IVpc, SecurityGroup, Port, Vpc, Peer} from "@aws-cdk/aws-ec2";

interface SecurityGroupContext {
  "vpcId": string,
  "ssl": boolean
}

export class SecurityGroupStack extends cdk.Stack {
  private context: SecurityGroupContext;
  private readonly vpc: IVpc;
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.context = this.node.tryGetContext(this.stackName);
    this.vpc = this.getVpc();

    this.albSecurityGroup = this.createAlbSecurityGroup(this.vpc);
    this.ec2SecurityGroup = this.createEc2SecurityGroup(this.vpc, this.albSecurityGroup);
    this.rdsSecurityGroup = this.createRdsSecurityGroup(this.vpc, this.ec2SecurityGroup);
  }

  private getVpc(): IVpc {
    return Vpc.fromLookup(this, 'Vpc', {
      vpcId: this.context.vpcId
    });
  }

  private createAlbSecurityGroup(vpc: IVpc): SecurityGroup {
    const securityGroup = new SecurityGroup(this, 'AlbSecurityGroup', {
      allowAllOutbound: true,
      securityGroupName: this.stackName + '-alb-sg',
      vpc: vpc,
    });

    if (this.context.ssl) {
      securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443));
    } else {
      securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80));
    }

    return securityGroup;
  }

  private createEc2SecurityGroup(vpc: IVpc, albSecurityGroup: SecurityGroup): SecurityGroup {
    const securityGroup = new SecurityGroup(this, 'Ec2SecurityGroup', {
      allowAllOutbound: true,
      securityGroupName: this.stackName + '-ec2-sg',
      vpc: vpc,
    });
    securityGroup.addIngressRule(albSecurityGroup, Port.tcp(80));
    return securityGroup;
  }

  private createRdsSecurityGroup(vpc: IVpc, ec2SecurityGroup: SecurityGroup): SecurityGroup {
    const securityGroup = new SecurityGroup(this, 'RdsSecurityGroup', {
      allowAllOutbound: true,
      securityGroupName: this.stackName + '-rds-sg',
      vpc: vpc,
    });
    securityGroup.addIngressRule(ec2SecurityGroup, Port.tcp(3306));
    securityGroup.addEgressRule(ec2SecurityGroup, Port.tcp(3306));
    return securityGroup;
  }
}
