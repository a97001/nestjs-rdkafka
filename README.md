
# nestjs-typegoose

[![NPM](https://nodei.co/npm/nestjs-rdkafka.png)](https://www.npmjs.com/package/nestjs-rdkafka)

[![npm version](https://badge.fury.io/js/nestjs-rdkafka.svg)](https://badge.fury.io/js/nestjs-rdkafka)
[![Build Status](https://travis-ci.org/a97001/nestjs-rdkafka.svg?branch=main)](https://travis-ci.org/a97001/nestjs-rdkafka)
![npm](https://img.shields.io/npm/dm/nestjs-rdkafka)
![npm bundle size](https://img.shields.io/bundlephobia/min/nestjs-rdkafka)  
[![Maintainability](https://api.codeclimate.com/v1/badges/53b44fd83fa37a8d7dba/maintainability)](https://codeclimate.com/github/a97001/nestjs-rdkafka/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/53b44fd83fa37a8d7dba/test_coverage)](https://codeclimate.com/github/a97001/nestjs-rdkafka/test_coverage)

## Description

A [NestJS](https://nestjs.com/) module wrapper for [node-rdkafka](https://github.com/Blizzard/node-rdkafka).

## Installation

```bash
npm i nestjs-rdkafka
```

## Basic usage

Initialize module with configuration of `consumer`, `producer` or `admin client` respectively. A full list of configuration can be found on `node-rdkafka`'s [Configuration](https://github.com/Blizzard/node-rdkafka#configuration) section.

**app.module.ts**
```typescript
import { Module } from "@nestjs/common";
import { TypegooseModule } from "nestjs-typegoose";
import { CatsModule } from "./cat.module.ts";

@Module({
  imports: [
    KafkaModule.forRootAsync({
        consumer: {
            conf: {
                'group.id': 'kafka_consumer',
                'metadata.broker.list': '127.0.0.1:9092'
            }
        },
        producer: {
            conf: {
                'client.id': 'kafka_prducer',
                'metadata.broker.list': '127.0.0.1:9092'
            }
        },
        adminClient: {
            conf: {
                'metadata.broker.list': '127.0.0.1:9092'
            }
        }
    }),
    CatsModule,
  ],
})
export class ApplicationModule {}
```

Inject the `kafka.service` in other provider/service to get the consumer, producer and or client.

**cats.service.ts**

```typescript
import { Injectable } from "@nestjs/common";
import { KafkaService } from '@a97001/nestjs-rdkafka';

@Injectable()
export class CatsService {
  constructor(
    private readonly kafkaService: KafkaService
  ) {
      const consumer = this.kafkaService.getConsumer(); // consumer

      const producer = this.kafkaService.getProducer(); // producer

      const adminClient = this.kafkaService.getAdminClient(); // admin client

      /* Throw Error if you get any of these without configuration in module initialization */
  }
}
```

## Disconnect
All clients will be automatically disconnected from Kafka `onModuleDestroy`. You can manually disconnect by calling:
```typescript
await this.kafkaService.disconnect();
```

## License

nestjs-rdkafka is [MIT licensed](LICENSE).