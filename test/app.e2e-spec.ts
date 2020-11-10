// import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import {
    Module,
    Injectable
} from '@nestjs/common';
import { KafkaModule } from '../src';

@Injectable()
class MockService {
    constructor(private readonly mockService: MockService) {

    }
}

@Module({
    providers: [MockService]
})
class MockModule { }

@Module({
    imports: [
        KafkaModule.forRootAsync({
            "group.id": 'nestjs-rdkafka-test',
            "metadata.broker.list": '127.0.0.1:9092',
            "security.protocol": false
        }),
        MockModule
    ]
})
export class MockApp { }

describe('App consuming KafkaModule', () => {
    let app;

    beforeAll(async () => {
        // await mongod.getConnectionString();

        const moduleFixture = await Test.createTestingModule({
            imports: [MockApp, MockModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(() => {
        app.close();
    });

    it('should mock app defined', async () => {
        expect(app).toBeDefined();
    });
});

// describe('Clear typegoose state after module destroy', () => {
//     let app: INestApplication;

//     beforeAll(async () => {
//         await mongod.getConnectionString();
//     });

//     afterAll(() => mongod.stop());

//     beforeEach(async () => {
//         const moduleFixture = await Test.createTestingModule({
//             imports: [MockApp, MockSubModule]
//         }).compile();

//         app = moduleFixture.createNestApplication();
//         await app.init();
//     });

//     afterEach(async () => {
//         await app.close();
//     });

//     Array.from({ length: 2 }).forEach(() => {
//         it('resolved model should use correct connection', async () => {
//             const model = await app.get(getModelToken(MockTypegooseClass.name));
//             await model.create({
//                 description: 'test'
//             });
//         });
//     });

//     it('should store and get mockSubTask', async () => {
//         await request(app.getHttpServer())
//             .post('/createSubTask')
//             .send({
//                 description: 'hello world',
//                 isSubtype: true
//             });

//         const response = await request(app.getHttpServer())
//             .post('/getSubTask')
//             .send({
//                 description: 'hello world',
//                 isSubtype: true
//             });

//         const body = response.body;

//         expect(body._id).toBeTruthy();
//         expect(body.isParent).toBe(false);
//         expect(body.isSubtype).toBe(true);
//     });
// });
