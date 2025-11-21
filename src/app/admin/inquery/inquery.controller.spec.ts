import { Test, TestingModule } from '@nestjs/testing';
import { InqueryController } from './inquery.controller';

describe('InqueryController', () => {
  let controller: InqueryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InqueryController],
    }).compile();

    controller = module.get<InqueryController>(InqueryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
