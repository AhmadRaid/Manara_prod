import { Test, TestingModule } from '@nestjs/testing';
import { InqueryService } from './inquery.service';

describe('InqueryService', () => {
  let service: InqueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InqueryService],
    }).compile();

    service = module.get<InqueryService>(InqueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
