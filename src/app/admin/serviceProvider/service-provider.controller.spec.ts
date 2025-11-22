import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderController } from './serviceProvider.controller';

describe('ServiceProviderController', () => {
  let controller: ServiceProviderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceProviderController],
    }).compile();

    controller = module.get<ServiceProviderController>(ServiceProviderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
