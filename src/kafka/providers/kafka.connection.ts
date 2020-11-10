import * as uuid from 'uuid';
import * as rdkafka from 'node-rdkafka';
import { KafkaConnectionOptions } from '../interfaces/kafka-connection-options';
import { KafkaConsumerOptions } from '../interfaces/kafka-consumer-options';
import { KafkaProducerOptions } from '../interfaces/kafka-producer-options';
import { KafkaAdminClientOptions } from '../interfaces/kafka-admin-client-options';

async function connectConsumer(options: KafkaConsumerOptions): Promise<rdkafka.KafkaConsumer> {
    try {
        const consumer = new rdkafka.KafkaConsumer(options.conf, options.topicConf);
        await new Promise((resolve) => {
            consumer.on('ready', () => {
                resolve();
            });
            consumer.connect();
        });
        return consumer;
    } catch (err) {
        throw err;
    }
}

async function connectProducer(options: KafkaProducerOptions): Promise<rdkafka.Producer> {
    try {
        if (!options['transactional.id']) {
            options['transactional.id'] = uuid.v1();
        }
        const producer = new rdkafka.Producer(options.conf, options.topicConf);
        await new Promise((resolve) => {
            producer.on('ready', () => {
                resolve();
            });
            producer.connect();
        });
        return producer;
    } catch (err) {
        throw err;
    }
}

async function connectAdminClient(options: KafkaAdminClientOptions): Promise<rdkafka.IAdminClient> {
    try {
        return rdkafka.AdminClient.create(options.conf);
    } catch (err) {
        throw err;
    }
}

export function getKafkaConnectionProvider(options: KafkaConnectionOptions) {
    return {
        provide: 'KafkaConnection',
        useFactory: async (): Promise<{ adminClient?: rdkafka.IAdminClient, consumer?: rdkafka.KafkaConsumer, producer?: rdkafka.Producer }> => {
            let adminClient: rdkafka.IAdminClient;
            let consumer: rdkafka.KafkaConsumer;
            let producer: rdkafka.Producer;

            if (options.consumer) {
                consumer = await connectConsumer(options.consumer);
            }
            if (options.producer) {
                producer = await connectProducer(options.producer);
            }
            if (options.adminClient) {
                adminClient = await connectAdminClient(options.adminClient);
            }
            return { adminClient, consumer, producer };
        },
        inject: []
    }
};