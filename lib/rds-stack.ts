import * as cdk from "@aws-cdk/core";
import {Stack, Construct, RemovalPolicy, SecretValue} from "@aws-cdk/core";
import {IVpc, InstanceType, InstanceClass, InstanceSize, SubnetType, SecurityGroup, Vpc, ISecurityGroup} from "@aws-cdk/aws-ec2";
import {AuroraMysqlEngineVersion, Credentials, DatabaseCluster, DatabaseClusterEngine} from "@aws-cdk/aws-rds";
import {StringParameter} from "@aws-cdk/aws-ssm";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {ComparisonOperator} from '@aws-cdk/aws-cloudwatch';

interface rdsContext {
  "vpcId": string,
  "rdsSecurityGroupId": string
  "rdsInstanceIdentifier": string,
  "rdsDatabaseName": string,
  "rdsMultiAz": boolean,
  "rdsInstanceCount": number,
  "deletionProtection": boolean,
  "cpuAlarmEvaluationPeriods": number,
  "cpuAlarmThreshold": number,
  "enablePerformanceInsights": boolean
}

export class RdsStack extends Stack {
  private context: rdsContext;
  private readonly vpc: IVpc;
  private readonly rdsSecurityGroup: ISecurityGroup;
  private readonly credentials: Credentials;
  public readonly rdsCluster: DatabaseCluster;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.context = this.node.tryGetContext(this.stackName);
    this.vpc = this.getVpc();
    this.credentials = this.createCredentials();
    this.rdsSecurityGroup = this.getRdsSecurityGroup();
    this.rdsCluster = this.createCluster();
    this.setAlarms();
  }

  private getVpc(): IVpc {
    return Vpc.fromLookup(this, 'Vpc', {
      vpcId: this.context.vpcId
    });
  }

  private getRdsSecurityGroup(): ISecurityGroup {
    return SecurityGroup.fromLookup(this, 'RdsSecurityGroup', this.context.rdsSecurityGroupId);
  }

  private createCredentials(): Credentials {
    const user = StringParameter.valueForStringParameter(this, this.stackName + '_USER_NAME', 1);
    return Credentials.fromPassword(user, SecretValue.ssmSecure(this.stackName + '_USER_PASSWORD', '1'));
  }

  private createCluster(): DatabaseCluster {
    return new DatabaseCluster(this, this.stackName + '-RdsCluster', {
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_2_09_1
      }),
      instanceProps: {
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: SubnetType.ISOLATED,
        },
        securityGroups: [
          this.rdsSecurityGroup
        ],
        instanceType: InstanceType.of(
            InstanceClass.T3,
            InstanceSize.SMALL
        ),
        enablePerformanceInsights: this.context.enablePerformanceInsights,
        autoMinorVersionUpgrade: false
      },
      clusterIdentifier: this.context.rdsInstanceIdentifier,
      instances: this.context.rdsInstanceCount,
      deletionProtection: this.context.deletionProtection,
      defaultDatabaseName: this.context.rdsDatabaseName,
      credentials: this.credentials,
      cloudwatchLogsExports: [
        'error', 'slowquery', 'audit'
      ],
      cloudwatchLogsRetention: RetentionDays.ONE_MONTH,
      storageEncrypted: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  private setAlarms(): void {
    const cpuMetric = this.rdsCluster.metricCPUUtilization({
      statistic: "Average"
    })
    cpuMetric.createAlarm(this, 'HighCPU', {
      evaluationPeriods: this.context.cpuAlarmEvaluationPeriods,
      threshold: this.context.cpuAlarmThreshold,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
    })
  }
}