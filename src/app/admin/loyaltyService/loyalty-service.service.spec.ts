import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyServiceService } from './loyaltyService.service';

describe('LoyaltyServiceService', () => {
  let service: LoyaltyServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyServiceService],
    }).compile();

    service = module.get<LoyaltyServiceService>(LoyaltyServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
