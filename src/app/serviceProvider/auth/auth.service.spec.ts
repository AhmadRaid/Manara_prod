import { Test, TestingModule } from '@nestjs/testing';
import { AuthProviderService } from './auth.service';

describe('AuthService', () => {
  let service: AuthProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthProviderService],
    }).compile();

    service = module.get<AuthProviderService>(AuthProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
