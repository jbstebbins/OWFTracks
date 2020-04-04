import { TestBed } from '@angular/core/testing';

import { OwfContainerService } from './owf-container.service';

describe('OwfContainerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OwfContainerService = TestBed.get(OwfContainerService);
    expect(service).toBeTruthy();
  });
});
