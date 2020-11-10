import { DynamicModule, Global, Module } from '@nestjs/common';
import { KafkaConnectionOptions } from './interfaces/kafka-connection-options';
import { getKafkaConnectionProvider } from './providers/kafka.connection';
import { KafkaService } from './services/kafka.service';

@Global()
@Module({})
export class KafkaModule {
  /**
   * Creates the connection to the kafka instance but is asynchronous instead.
   * @param options the options for the node-rdkafka connection.
   * @internal
   */
  static forRootAsync(options: KafkaConnectionOptions): DynamicModule {

    const connectionProvider = getKafkaConnectionProvider(options);
    // const asyncProviders = this.createAsyncProviders(options);
    return {
      module: KafkaModule,
      // imports: options.imports, // imports from async for root
      providers: [
        connectionProvider,
        KafkaService
      ],
      exports: [KafkaService, connectionProvider]
    };
  }

  /**
   * Cleans up the connection and removes the models to prevent unintended usage.
   * @internal
   */
  // async onApplicationShutdown() {
  //   const connection = this.moduleRef.get<any>(this.connectionName);

  //   if (connection) {
  //     await connection.close();
  //     [...models.entries()].reduce((array, [key, model]) => {
  //       if (model.db === connection) {
  //         array.push(key);
  //       }
  //       return array;
  //     }, []).forEach(deleteModel);
  //   }
  // }
}
