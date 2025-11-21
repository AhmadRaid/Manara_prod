import { Test, TestingModule } from '@nestjs/testing';
import { EarningMethodService } from './earningMethod.service';

describe('EarningMethodService', () => {
  let service: EarningMethodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EarningMethodService],
    }).compile();

    service = module.get<EarningMethodService>(EarningMethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
