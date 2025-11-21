import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyServiceController } from './loyaltyService.controller';

describe('LoyaltyServiceController', () => {
  let controller: LoyaltyServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyServiceController],
    }).compile();

    controller = module.get<LoyaltyServiceController>(LoyaltyServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
