import { Test, TestingModule } from '@nestjs/testing';
import { EarningMethodController } from './earningMethod.controller';

describe('EarningMethodController', () => {
  let controller: EarningMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EarningMethodController],
    }).compile();

    controller = module.get<EarningMethodController>(EarningMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
