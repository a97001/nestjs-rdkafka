import { Injectable, Inject, OnModuleDestroy, OnApplicationBootstrap } from '@nestjs/common';
import delay = require('delay');
import * as rdkafka from 'node-rdkafka';

@Injectable()
export class KafkaService implements OnApplicationBootstrap, OnModuleDestroy {
    private producer: rdkafka.Producer;
    private consumer: rdkafka.KafkaConsumer;
    private adminClient: rdkafka.IAdminClient;
    private subscriberMap = new Map<string, { config: rdkafka.NewTopic, callback: (message) => Promise<void> }>();
    private keepConsumerRunning = true;
    private isConsumingMsg = false;

    constructor(
        @Inject('KafkaConnection') kafkaConnection
    ) {
        this.producer = kafkaConnection.producer;
        this.consumer = kafkaConnection.consumer;
        this.adminClient = kafkaConnection.adminClient;
    }

    public getAdminClient(): rdkafka.IAdminClient {
        if (!this.adminClient) {
            throw new Error('Admin client is not initialized.')
        }
        return this.adminClient;
    }

    public getConsumer(): rdkafka.KafkaConsumer {
        if (!this.consumer) {
            throw new Error('Consumer is not initialized.')
        }
        return this.consumer;
    }

    public getProducer(): rdkafka.Producer {
        if (!this.producer) {
            throw new Error('Producer is not initialized.')
        }
        return this.producer;
    }

    public async disconnect(): Promise<void> {
        this.keepConsumerRunning = false;
        if (this.consumer && this.consumer.isConnected) {
            await new Promise(async (resolve) => {
                while (this.isConsumingMsg) {
                    await delay(500);
                }
                this.consumer.disconnect(() => resolve());
            });
        }

        if (this.producer && this.producer.isConnected) {
            await new Promise((resolve) => {
                this.producer.disconnect(() => resolve());
            });
        }

        if (this.adminClient) {
            await new Promise((resolve) => {
                this.adminClient.disconnect();
                resolve();
            });
        }
    }

    public getSubscribedTopics(): Map<string, { config: rdkafka.NewTopic, callback: (message) => Promise<void> }> {
        return this.subscriberMap;
    }

    public subscribeTopic(config: rdkafka.NewTopic, callback: (message) => Promise<void>) {
        this.subscriberMap.set(config.topic, { config, callback });
    }

    private async createTopics() {
        const topicConfigs = Array.from(this.subscriberMap.values()).map(v => v.config);
        const promises = topicConfigs.map((config) => new Promise((resolve) => this.adminClient.createTopic(config, (err) => {
            if (err) {
                console.log(err);
            }
            resolve();
        })));
        await Promise.all(promises);
        const topicList = topicConfigs.map(topicConfig => topicConfig.topic);
        if (topicList.length > 0) {
            this.consumer.subscribe(topicList);
        } else {
            this.keepConsumerRunning = false;
        }
    }

    async consumeMessage(err, messages: rdkafka.Message[]): Promise<void> {
        if (err) {
            throw err;
        }
        const messageMap = new Map<string, { key: string, value: any, timestamp: number, headers: any }[]>();
        for (const msg of messages) {
            if (!messageMap.has(msg.topic)) {
                messageMap.set(msg.topic, []);
            }
            messageMap.get(msg.topic).push({
                key: msg.key.toString('utf-8'), value: msg.value, timestamp: msg.timestamp, headers: msg.headers[0]
            });
        }
        const promises = [];
        for (const key of messageMap.keys()) {
            promises.push(this.subscriberMap.get(key).callback(messageMap.get(key)));
        }
        try {
            await Promise.all(promises);
            this.consumer.commit();
        } catch (err) {
            throw err;
        }
    }

    private async consumeMessages() {
        while (this.keepConsumerRunning) {
            this.isConsumingMsg = true;
            await new Promise((resolve, reject) => {
                try {
                    this.consumer.consume(100, async (err, messages) => {
                        await this.consumeMessage(err, messages);
                        resolve();
                    })
                } catch (err) {
                    reject(err);
                }
            });
            this.isConsumingMsg = false;
        }
    }

    async onApplicationBootstrap(): Promise<void> {
        await this.createTopics();
        this.consumeMessages();
    }

    /**
     * Cleans up the connection
     * @internal
     */
    async onModuleDestroy(): Promise<void> {
        await this.disconnect()
    }
}