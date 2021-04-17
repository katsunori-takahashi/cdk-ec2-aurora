import * as cdk from '@aws-cdk/core';
import {Topic, Subscription, SubscriptionProtocol} from '@aws-cdk/aws-sns';

interface SnsContext {
  "email": string
}

export class SnsStack extends cdk.Stack {
  private context: SnsContext;
  readonly topic: Topic;
  readonly subscription: Subscription

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.context = this.node.tryGetContext(this.stackName);
    this.topic = this.createTopic();
    this.subscription = this.setSubscription(this.topic);
  }

  private createTopic() {
    return new Topic(this, 'Topic', {});
  }

  private setSubscription(topic: Topic) {
    return new Subscription(this, 'Subscription', {
      endpoint: this.context.email,
      protocol: SubscriptionProtocol.EMAIL,
      topic: topic
    });
  }
}
