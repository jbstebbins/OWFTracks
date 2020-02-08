import { TestBed } from '@angular/core/testing';

import { CotMinotaurService } from './cot-minotaur.service';

describe('CotMinotaurService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CotMinotaurService = TestBed.get(CotMinotaurService);
    expect(service).toBeTruthy();
  });
});
