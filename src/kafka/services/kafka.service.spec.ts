import { Test, TestingModule } from '@nestjs/testing';
import { KafkaConnectionOptions } from '../interfaces/kafka-connection-options';
import { KafkaModule } from '../kafka.module';
import { KafkaService } from './kafka.service';
// import { kafkaConnectionProvider } from '../providers/kafka.connection';
// import { CommonModule } from '../../common/common.module';

describe('KafkaService', () => {
    let service: KafkaService;
    let module: TestingModule;

    const mockKafkaMessages = [{
        value: Buffer.from(JSON.stringify({}), 'utf-8'),
        size: 1,
        topic: 'example.topic',
        offset: 0,
        partition: 0,
        key: 'key',
        timestamp: new Date().getTime(),
        headers: []
    }];

    const runSubscribeTopic = (service: KafkaService) => {
        service.subscribeTopic({
            topic: `example.topic`,
            num_partitions: 1,
            replication_factor: 1,
            config: { 'delete.retention.ms': '432000000' }
            // eslint-disable-next-line @typescript-eslint/no-empty-function
        }, async () => { });
    }

    const initModule = async (options: KafkaConnectionOptions = {
        consumer: {
            conf: {
                "group.id": 'nestjs-rdkafka-test',
                "metadata.broker.list": '127.0.0.1:9092',
                "security.protocol": 'plaintext'
            }
        },
        producer: {
            conf: {
                "metadata.broker.list": '127.0.0.1:9092',
                "security.protocol": 'plaintext'
            }
        },
        adminClient: {
            conf: {
                "metadata.broker.list": '127.0.0.1:9092',
                "security.protocol": 'plaintext'
            }
        }
    }) => {
        module = await Test.createTestingModule({
            imports: [
                KafkaModule.forRootAsync(options)
            ],
            providers: [KafkaService],
        }).compile();
        service = module.get<KafkaService>(KafkaService);
    }

    describe('features', () => {
        it('should be defined', async () => {
            await initModule();
            expect(service).toBeDefined();
        });

        it('should get admin client', async () => {
            await initModule();
            expect(service.getAdminClient()).toBeDefined();
        });

        it('should not get admin client', async () => {
            await initModule({});
            expect(() => service.getAdminClient()).toThrow('Admin client is not initialized.');
        });

        it('should get consumer', async () => {
            await initModule();
            expect(service.getConsumer()).toBeDefined();
        });

        it('should not get consumer', async () => {
            await initModule({});
            expect(() => service.getConsumer()).toThrow('Consumer is not initialized.');
        });

        it('should get producer', async () => {
            await initModule();
            expect(service.getProducer()).toBeDefined();
        });

        it('should get not producer', async () => {
            await initModule({});
            expect(() => service.getProducer()).toThrow('Producer is not initialized.');
        });

        it('should subscribe topic and get subscribed topics', async () => {
            await initModule();
            runSubscribeTopic(service);
            expect(service.getSubscribedTopics().size > 0);
        });

        it('should create topics', async () => {
            await initModule();
            runSubscribeTopic(service);
            expect(await service.onApplicationBootstrap()).not.toThrow;
        });

        describe('App consuming KafkaModule', () => {
            it('should consume message', async () => {
                await initModule();
                runSubscribeTopic(service);
                expect(await service.consumeMessage(null, mockKafkaMessages)).not.toThrow;
            });

            it('should consume message (error)', async () => {
                await initModule();
                runSubscribeTopic(service);
                await expect(service.consumeMessage(new Error(), mockKafkaMessages)).rejects.toThrow();
            });
        });

        afterEach(async () => await service.disconnect())
    })

    describe('clean up', () => {
        it('should run disconnect', async () => {
            await initModule();
            expect(await service.disconnect()).not.toThrow;
        });

        it('should run on module destroy', async () => {
            await initModule();
            expect(await service.onModuleDestroy()).not.toThrow;
        });
    })

});