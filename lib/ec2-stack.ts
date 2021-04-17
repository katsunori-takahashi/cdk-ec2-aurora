import * as cdk from '@aws-cdk/core';
import {
  Vpc,
  SubnetType,
  Instance,
  InstanceType,
  InstanceClass,
  InstanceSize,
  AmazonLinuxImage,
  AmazonLinuxGeneration,
  IVpc,
  SecurityGroup,
  ISecurityGroup,
  IInstance
} from "@aws-cdk/aws-ec2";
import {ApplicationListener, ApplicationLoadBalancer} from '@aws-cdk/aws-elasticloadbalancingv2';
import {InstanceIdTarget} from "@aws-cdk/aws-elasticloadbalancingv2-targets";
import {Duration} from "@aws-cdk/core";

interface ec2Context {
  "vpcId": string,
  "ssl": boolean,
  "albSecurityGroupId": string,
  "ec2SecurityGroupId": string,
  "sshKeyName": string,
  "certificateArn": string
}

export class Ec2Stack extends cdk.Stack {
  private context: ec2Context;
  private appListener: ApplicationListener;
  private readonly vpc: IVpc;
  private readonly ec2SecurityGroup: ISecurityGroup;
  private readonly albSecurityGroup: ISecurityGroup;
  public readonly instance: IInstance;
  public readonly alb: ApplicationLoadBalancer;


  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.context = this.node.tryGetContext(this.stackName);
    this.vpc = this.getVpc();
    this.ec2SecurityGroup = this.getEc2SecurityGroup();
    this.albSecurityGroup = this.getAlbSecurityGroup();

    this.instance = this.createEc2();
    this.alb = this.createAlb();
  }

  private getVpc(): IVpc {
    return Vpc.fromLookup(this, 'Vpc', {
      vpcId: this.context.vpcId
    });
  }

  private getEc2SecurityGroup(): ISecurityGroup {
    return SecurityGroup.fromLookup(this, 'ec2SecurityGroup', this.context.ec2SecurityGroupId);
  }

  private getAlbSecurityGroup(): ISecurityGroup {
    return SecurityGroup.fromLookup(this, 'albSecurityGroup', this.context.albSecurityGroupId);
  }

  private createEc2(): IInstance {
    const instance = new Instance(this, this.stackName + '-Ec2', {
      instanceName: this.stackName + '-Ec2',
      vpc: this.vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      allowAllOutbound: true,
      keyName: this.context.sshKeyName,
      vpcSubnets: {subnetType: SubnetType.PUBLIC},
      securityGroup: this.ec2SecurityGroup,
    });

    instance.instance.creditSpecification = {cpuCredits: 'standard'};
    instance.instance.blockDeviceMappings = [{deviceName: '/dev/xvda', ebs: {volumeSize: 100, volumeType: 'gp2'}}];

    return instance;
  }

  private createAlb(): ApplicationLoadBalancer {
    const alb = new ApplicationLoadBalancer(this, this.stackName + '-Alb', {
      loadBalancerName: this.stackName + '-Alb',
      vpc: this.vpc,
      internetFacing: true,
      idleTimeout: Duration.minutes(10),
      securityGroup: this.albSecurityGroup,
    });

    if (this.context.ssl) {
      this.appListener = alb.addListener(this.stackName + '-AppListener', {port: 443});
      this.appListener.addCertificates(this.stackName + '-AppCertificateArns', [{certificateArn: this.context.certificateArn}]);
    } else {
      this.appListener = alb.addListener(this.stackName + 'AppListener', {port: 80});
    }

    const instanceTarget = new InstanceIdTarget(this.instance.instanceId, 80);
    this.appListener.addTargets(this.stackName + '-AppTarget', {
      targetGroupName: this.stackName + '-AppTarget',
      port: 80,
      targets: [
        instanceTarget
      ],
      healthCheck: {
        path: '/health_check.php',
      }
    });

    return alb;
  }
}
