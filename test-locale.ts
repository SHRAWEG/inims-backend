import { DataSource } from 'typeorm';
import { DisaggregationOption } from './src/modules/disaggregation-options/entities/disaggregation-option.entity';

async function run() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: 'postgres://lily:lily@localhost:5432/inims_db', // Adjust URL if necessary
    entities: [DisaggregationOption],
  });
  await dataSource.initialize();
  const option = await dataSource.getRepository(DisaggregationOption).findOne({ where: {} });
  console.log(option?.name);
  await dataSource.destroy();
}
run();
