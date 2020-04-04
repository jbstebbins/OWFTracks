import { TestBed } from '@angular/core/testing';

import { OwfCoreService } from './owf-core.service';

describe('OwfCoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OwfCoreService = TestBed.get(OwfCoreService);
    expect(service).toBeTruthy();
  });
});
